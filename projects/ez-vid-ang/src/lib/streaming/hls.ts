/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Directive,
  inject,
  input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../api/eva-api';
import { EvaAudioTrack, EvaQualityLevel, EvaStreamSubtitleTrack } from '../types';

declare let Hls: {
  new(config?: EvaHlsConfig): any;
  isSupported: () => boolean;
  Events: {
    MANIFEST_PARSED: string;
    LEVEL_SWITCHED: string;
    LEVEL_LOADED: string;
    AUDIO_TRACKS_UPDATED: string;
    AUDIO_TRACK_SWITCHED: string;
    SUBTITLE_TRACKS_UPDATED: string;
  };
};

/**
 * Subset of hls.js configuration options exposed by `EvaHlsDirective`.
 *
 * @see https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning
 */
export type EvaHlsConfig = {
  autoStartLoad?: boolean;
  xhrSetup?: (xhr: XMLHttpRequest, url: string) => void;
  maxBufferLength?: number;
  maxBufferSize?: number;
  [key: string]: any;
}

/**
 * HLS streaming directive for the Eva video player.
 *
 * Applied directly on `<eva-player>`. Uses `EvaApi.assignedVideoElement` to attach
 * hls.js to the internal `<video>` element after the player signals readiness.
 *
 * After the manifest is parsed, the directive:
 * - Registers parsed quality levels with `EvaApi.registerQualityLevels()`.
 * - Registers its quality setter with `EvaApi.registerQualityFn()` so that
 *   `EvaQualitySelector` can switch levels via `EvaApi.setQuality()` without
 *   knowing anything about the streaming library.
 * - Listens to `LEVEL_LOADED` and updates `EvaApi.isLive` from
 *   `data.details.live`. This is required because hls.js serves live streams
 *   via MSE with a finite DVR-window duration, so the browser never reports
 *   `duration === Infinity` — the only signal reliable for native HLS (Safari).
 *
 * Falls back to setting `src` directly on the video element for browsers with
 * native HLS support (e.g. Safari). In that case no quality levels are registered
 * since native HLS does not expose them, and `EvaApi.isLive` is derived from
 * `duration === Infinity` in the `loadedmetadata` handler.
 *
 * hls.js renders subtitle/caption tracks natively and, left unchecked, would
 * auto-display whichever track the manifest marks as `DEFAULT=YES`, independently
 * of `EvaTrackSelector`'s own "Off"-by-default state. `subtitleDisplay` defaults to
 * `false` in the hls.js config so no manifest subtitle track is shown until explicitly
 * selected. After `SUBTITLE_TRACKS_UPDATED`, discovered tracks are registered with
 * `EvaApi.registerStreamSubtitleTracks()` and `registerSubtitleTrackFn()` so they
 * appear — and can be switched — directly from `EvaTrackSelector`, merged alongside
 * any `evaVideoTracks`-declared tracks. Override the initial `subtitleDisplay` default
 * via `evaHlsConfig` (e.g. `{ subtitleDisplay: true }`) to restore hls.js's native
 * auto-display behaviour instead.
 *
 * @example
 * // Minimal usage
 * <eva-player
 *   evaHls
 *   id="my-player"
 *   [evaVideoSources]="[]"
 *   evaHlsSrc="https://example.com/stream.m3u8"
 * />
 *
 * @example
 * // With custom headers and config
 * <eva-player
 *   evaHls
 *   id="my-player"
 *   [evaVideoSources]="[]"
 *   evaHlsSrc="https://example.com/stream.m3u8"
 *   [evaHlsHeaders]="{ Authorization: 'Bearer token' }"
 *   [evaHlsConfig]="{ maxBufferLength: 30 }"
 * />
 */
@Directive({
  selector: 'eva-player[evaHls]',
  exportAs: 'evaHls'
})
export class EvaHlsDirective implements OnInit, OnChanges, OnDestroy {
  private readonly evaAPI = inject(EvaApi);

  /**
   * The HLS stream URL (`.m3u8` manifest).
   *
   * **Required.** Changing this at runtime destroys the current hls.js instance
   * and creates a new one with the updated source.
   */
  public readonly evaHlsSrc = input.required<string>();

  /**
   * Optional HTTP headers attached to every segment request via `xhrSetup`.
   *
   * @default {}
   */
  public readonly evaHlsHeaders = input<Record<string, string>>({});

  /**
   * Hls.js configuration overrides merged with the directive's defaults.
   *
   * @default {}
   */
  public readonly evaHlsConfig = input<EvaHlsConfig>({});

  /** The active hls.js instance. `null` when not initialized or after destruction. */
  private hls: any = null;

  /** Subscription to `EvaApi.playerReadyEvent`. Used to defer setup until the player is ready. */
  private playerReady$: Subscription | null = null;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['evaHlsSrc'] && !changes['evaHlsSrc'].firstChange) {
      this.createPlayer();
    }
  }

  public ngOnInit(): void {
    if (this.evaAPI.isPlayerReady) {
      this.createPlayer();
    } else {
      this.playerReady$ = this.evaAPI.playerReadyEvent.subscribe(() => {
        this.createPlayer();
        this.playerReady$?.unsubscribe();
      });
    }
  }

  public ngOnDestroy(): void {
    this.destroyPlayer();
    this.playerReady$?.unsubscribe();
  }

  /**
   * Creates and configures a new hls.js instance.
   *
   * After `MANIFEST_PARSED`:
   * - Calls `EvaApi.registerQualityLevels()` with the parsed levels.
   * - Calls `EvaApi.registerQualityFn()` with a bound reference to `setQualityLevel()`
   *   so that `EvaQualitySelector` can switch quality via `EvaApi.setQuality()`.
   *
   * On `LEVEL_LOADED`:
   * - Writes `data.details.live` to `EvaApi.isLive`. The event fires each time a
   *   level playlist is fetched, so for live streams this also fires on every
   *   playlist refresh, keeping `isLive` accurate across source changes.
   *
   * Defaults `subtitleDisplay` to `false` so a manifest subtitle track marked
   * `DEFAULT=YES` is not auto-shown by hls.js while `EvaTrackSelector` reports "Off".
   * `userConfig` is spread after this default so `evaHlsConfig` can still override it.
   *
   * On `SUBTITLE_TRACKS_UPDATED`:
   * - Calls `EvaApi.registerStreamSubtitleTracks()` with the parsed tracks.
   * - Calls `EvaApi.registerSubtitleTrackFn()` with a bound reference to `setSubtitleTrack()`
   *   so `EvaTrackSelector` can switch subtitle tracks via `EvaApi.setStreamSubtitleTrack()`.
   */
  private createPlayer(): void {
    this.destroyPlayer();

    const src = this.evaHlsSrc();
    if (!src) { return; }

    const video = this.evaAPI.assignedVideoElement;
    if (!video) { return; }

    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      const userConfig = this.evaHlsConfig();
      const userXhrSetup = userConfig.xhrSetup as ((xhr: XMLHttpRequest, url: string) => void) | undefined;
      const config: EvaHlsConfig = {
        autoStartLoad: true,
        subtitleDisplay: false,
        ...userConfig,
        xhrSetup: (xhr: XMLHttpRequest, url: string) => {
          const headers = this.evaHlsHeaders();
          for (const key of Object.keys(headers)) {
            xhr.setRequestHeader(key, headers[key]);
          }
          userXhrSetup?.(xhr, url);
        },
      };

      this.hls = new Hls(config);

      this.hls.on(Hls.Events.MANIFEST_PARSED, (_event: any, data: { levels: any[] }) => {
        const levels: EvaQualityLevel[] = [
          {
            qualityIndex: -1,
            label: 'Auto',
            width: 0,
            height: 0,
            bitrate: 0,
            mediaType: 'video',
            isAuto: true,
            selected: true,
          },
          ...data.levels.map((level, index) => ({
            qualityIndex: index,
            label: level.height ? `${level.height}p` : `Level ${index}`,
            width: level.width ?? 0,
            height: level.height ?? 0,
            bitrate: level.bitrate ?? 0,
            mediaType: 'video' as const,
            codec: level.videoCodec,
            frameRate: level.frameRate,
          })),
        ];

        // Register levels and quality setter with EvaApi
        this.evaAPI.registerQualityLevels(levels);
        this.evaAPI.registerQualityFn(this.setQualityLevel.bind(this));
      });

      this.hls.on(Hls.Events.LEVEL_SWITCHED, (_event: any, data: { level: number }) => {
        this.evaAPI.currentQualityIndex.set(data.level);
      });

      this.hls.on(Hls.Events.LEVEL_LOADED, (_event: any, data: { details: { live: boolean } }) => {
        this.evaAPI.isLive.set(data.details.live);
      });

      this.hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event: any, data: { audioTracks: { id: number; name: string; lang: string; }[] }) => {
        this.registerHlsAudioTracks(data.audioTracks);
      });

      this.hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_event: any, data: { id: number }) => {
        this.evaAPI.currentAudioTrackId.set(data.id);
      });

      this.hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_event: any, data: { subtitleTracks: { id: number; name: string; lang: string; }[] }) => {
        this.registerHlsSubtitleTracks(data.subtitleTracks);
      });

      this.hls.attachMedia(video);
      this.hls.loadSource(src);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      console.warn('[EvaHls] HLS is not supported in this browser.');
    }
  }

  /**
   * Maps hls.js `audioTracks` entries to `EvaAudioTrack[]` and registers them with
   * `EvaApi`. Extracted from `createPlayer()`'s `AUDIO_TRACKS_UPDATED` handler to keep
   * that method within the project's line-count limit.
   */
  private registerHlsAudioTracks(audioTracks: { id: number; name: string; lang: string; }[]): void {
    const tracks: EvaAudioTrack[] = audioTracks.map(t => ({
      id: t.id,
      label: t.name || t.lang || `Track ${t.id}`,
      ...(t.lang ? { language: t.lang } : {}),
    }));
    this.evaAPI.registerAudioTracks(tracks);
    this.evaAPI.registerAudioTrackFn(this.setAudioTrack.bind(this));
    this.evaAPI.currentAudioTrackId.set((this.hls?.audioTrack as number | undefined) ?? 0);
  }

  /**
   * Maps hls.js `subtitleTracks` entries to `EvaStreamSubtitleTrack[]` and registers
   * them with `EvaApi`. Extracted from `createPlayer()`'s `SUBTITLE_TRACKS_UPDATED`
   * handler to keep that method within the project's line-count limit.
   */
  private registerHlsSubtitleTracks(subtitleTracks: { id: number; name: string; lang: string; }[]): void {
    const tracks: EvaStreamSubtitleTrack[] = subtitleTracks.map(t => ({
      id: t.id,
      label: t.name || t.lang || `Track ${t.id}`,
      ...(t.lang ? { language: t.lang } : {}),
    }));
    this.evaAPI.registerStreamSubtitleTracks(tracks);
    this.evaAPI.registerSubtitleTrackFn(this.setSubtitleTrack.bind(this));
  }

  private destroyPlayer(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
      this.evaAPI.registerAudioTracks([]);
      this.evaAPI.registerStreamSubtitleTracks([]);
    }
  }

  /**
   * Switches to a specific quality level by index.
   * Called internally by `EvaApi.setQuality()` via the registered quality function.
   * Pass `-1` to enable Auto (ABR) mode.
   *
   * @param level - The `qualityIndex` from an `EvaQualityLevel` object.
   */
  public setQualityLevel(level: number): void {
    if (!this.hls) { return; }
    this.hls.nextLevel = level;
  }

  /**
   * Switches to the audio track with the given `id`.
   * Called internally by `EvaApi.setAudioTrack()` via the registered audio track function.
   *
   * @param id - The `id` from an `EvaAudioTrack` object (maps to the hls.js audio track index).
   */
  public setAudioTrack(id: number): void {
    if (!this.hls) { return; }
    (this.hls as { audioTrack: number }).audioTrack = id;
  }

  /**
   * Switches to the subtitle track with the given `id`, or turns subtitles off.
   * Called internally by `EvaApi.setStreamSubtitleTrack()` via the registered
   * subtitle track function.
   *
   * @param id - The `id` from an `EvaStreamSubtitleTrack` object (maps to the hls.js
   *   subtitle track index), or `-1` to turn subtitles off.
   */
  public setSubtitleTrack(id: number): void {
    if (!this.hls) { return; }
    const hls = this.hls as { subtitleTrack: number; subtitleDisplay: boolean };
    hls.subtitleTrack = id;
    hls.subtitleDisplay = id !== -1;
  }

  /**
   * Returns the raw hls.js instance for advanced use cases.
   * Returns `null` if the player has not been initialized.
   */
  public getHlsInstance(): any {
    return this.hls;
  }
}