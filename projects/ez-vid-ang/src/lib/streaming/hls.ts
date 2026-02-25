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
import { EvaQualityLevel } from '../types';

declare let Hls: {
  new(config?: EvaHlsConfig): any;
  isSupported: () => boolean;
  Events: {
    MANIFEST_PARSED: string;
    LEVEL_SWITCHED: string;
  };
};

/**
 * Subset of hls.js configuration options exposed by `EvaHlsDirective`.
 *
 * @see https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning
 */
export interface EvaHlsConfig {
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
 *
 * Falls back to setting `src` directly on the video element for browsers with
 * native HLS support (e.g. Safari). In that case no quality levels are registered
 * since native HLS does not expose them.
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
  private evaAPI = inject(EvaApi);

  /**
   * The HLS stream URL (`.m3u8` manifest).
   *
   * **Required.** Changing this at runtime destroys the current hls.js instance
   * and creates a new one with the updated source.
   */
  readonly evaHlsSrc = input.required<string>();

  /**
   * Optional HTTP headers attached to every segment request via `xhrSetup`.
   *
   * @default {}
   */
  readonly evaHlsHeaders = input<{ [key: string]: string }>({});

  /**
   * hls.js configuration overrides merged with the directive's defaults.
   *
   * @default {}
   */
  readonly evaHlsConfig = input<EvaHlsConfig>({});

  /** The active hls.js instance. `null` when not initialized or after destruction. */
  private hls: any = null;

  /** Subscription to `EvaApi.playerReadyEvent`. Used to defer setup until the player is ready. */
  private playerReady$: Subscription | null = null;

  ngOnInit(): void {
    if (this.evaAPI.isPlayerReady) {
      this.createPlayer();
    } else {
      this.playerReady$ = this.evaAPI.playerReadyEvent.subscribe(() => {
        this.createPlayer();
        this.playerReady$?.unsubscribe();
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['evaHlsSrc'] && !changes['evaHlsSrc'].firstChange) {
      this.createPlayer();
    }
  }

  ngOnDestroy(): void {
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
   */
  private createPlayer(): void {
    this.destroyPlayer();

    const src = this.evaHlsSrc();
    if (!src) return;

    const video = this.evaAPI.assignedVideoElement;
    if (!video) return;

    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
      const config: EvaHlsConfig = {
        autoStartLoad: true,
        xhrSetup: (xhr: XMLHttpRequest) => {
          const headers = this.evaHlsHeaders();
          for (const key of Object.keys(headers)) {
            xhr.setRequestHeader(key, headers[key]);
          }
        },
        ...this.evaHlsConfig(),
      };

      this.hls = new Hls(config);

      this.hls.on(Hls.Events.MANIFEST_PARSED, (_event: any, data: { levels: any[] }) => {
        // console.log("MANIFEST PARSED");
        // console.log(_event);
        // console.log(data);

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

      this.hls.on(Hls.Events.LEVEL_SWITCHED, (_event: any, _data: { level: number }) => {
      });

      this.hls.attachMedia(video);
      this.hls.loadSource(src);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else {
      console.warn('[EvaHls] HLS is not supported in this browser.');
    }
  }

  private destroyPlayer(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
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
    if (!this.hls) return;
    this.hls.nextLevel = level;
  }

  /**
   * Returns the raw hls.js instance for advanced use cases.
   * Returns `null` if the player has not been initialized.
   */
  public getHlsInstance(): any {
    return this.hls;
  }
}