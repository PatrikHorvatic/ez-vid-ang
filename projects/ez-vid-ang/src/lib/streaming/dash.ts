/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Directive,
  inject,
  input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../api/eva-api';
import { EvaQualityLevel } from '../types';

declare let dashjs: {
  MediaPlayer: {
    (): {
      create: () => {
        initialize: (view?: HTMLMediaElement, source?: string, autoPlay?: boolean) => void;
        on: (type: string, listener: (e: unknown) => void) => void;
        attachSource: (urlOrManifest: string | object, startTime?: number | string) => void;
        updateSettings: (settings: Record<string, unknown>) => void;
        setAutoPlay: (value: boolean) => void;
        setProtectionData: (value: unknown) => void;
        getRepresentationsByType: (type: 'video' | 'audio') => {
          index: number;
          bandwidth: number;
          width: number;
          height: number;
          frameRate: number;
          codecs: string | null;
        }[];
        setRepresentationForTypeByIndex: (type: 'video' | 'audio', index: number, forceReplace?: boolean) => void;
        reset: () => void;
      };
    };
    events: { STREAM_INITIALIZED: string };
  };
  Debug: { LOG_LEVEL_NONE: number };
};

/**
 * Subset of dash.js `updateSettings` options exposed by `EvaDashDirective`.
 *
 * @see https://cdn.dashjs.org/latest/jsdoc/module-Settings.html
 */
export type EvaDashConfig = Record<string, unknown>;

/** Subset of a dash.js 5.x `Representation` object used for quality level mapping. */
type DashRepresentation = {
  index: number;
  bandwidth: number;
  width: number;
  height: number;
  frameRate: number;
  codecs: string | null;
}

/**
 * DRM license server configuration for protected DASH streams.
 */
export type EvaDRMLicenseServer = Record<string, {
  serverURL: string;
  httpRequestHeaders?: Record<string, string>;
}>

/**
 * DASH streaming directive for the Eva video player.
 *
 * Applied directly on `<eva-player>`. Uses `EvaApi.assignedVideoElement` to attach
 * dash.js to the internal `<video>` element after the player signals readiness.
 *
 * After the stream initializes, the directive:
 * - Registers parsed video quality levels with `EvaApi.registerQualityLevels()`.
 * - Registers its quality setter with `EvaApi.registerQualityFn()` so that
 *   `EvaQualitySelector` can switch levels via `EvaApi.setQuality()` without
 *   knowing anything about the streaming library.
 *
 * DRM-protected streams are supported via `evaDashDRMLicenseServer` and
 * an optional `evaDashDRMToken` for authorization headers.
 *
 * DASH streaming is fully optional. If this directive is absent, `EvaPlayer`
 * falls back to sources provided via `evaVideoSources`.
 *
 * > **Prerequisite:** dash.js must be available globally. Install via
 * > `npm install dashjs` and include it in your build, or load from a CDN.
 *
 * @example
 * // Minimal usage
 * <eva-player
 *   evaDash
 *   id="my-player"
 *   [evaVideoSources]="[]"
 *   evaDashSrc="https://example.com/stream.mpd"
 * />
 *
 * @example
 * // With DRM protection
 * <eva-player
 *   evaDash
 *   id="my-player"
 *   [evaVideoSources]="[]"
 *   evaDashSrc="https://example.com/stream.mpd"
 *   evaDashDRMToken="Bearer my-token"
 *   [evaDashDRMLicenseServer]="{ 'com.widevine.alpha': { serverURL: 'https://license.example.com' } }"
 * />
 */
@Directive({
  selector: 'eva-player[evaDash]',
  exportAs: 'evaDash'
})
export class EvaDashDirective implements OnInit, OnChanges, OnDestroy {
  private readonly evaAPI = inject(EvaApi);

  /**
   * The DASH stream URL (`.mpd` manifest).
   *
   * **Required.** Changing this at runtime destroys the current dash.js instance
   * and creates a new one with the updated source.
   */
  public readonly evaDashSrc = input.required<string>();

  /**
   * Authorization token applied to DRM license server request headers.
   * Only used when `evaDashDRMLicenseServer` is also provided.
   *
   * @default undefined
   */
  public readonly evaDashDRMToken = input<string | undefined>(undefined);

  /**
   * DRM license server configuration for protected streams.
   * Keys are DRM system strings (e.g. `"com.widevine.alpha"`).
   *
   * @default undefined
   */
  public readonly evaDashDRMLicenseServer = input<EvaDRMLicenseServer | undefined>(undefined);

  /**
   * Dash.js settings overrides applied via `updateSettings()` after the player is initialized.
   * Merged on top of the directive's defaults (debug level).
   *
   * @see https://cdn.dashjs.org/latest/jsdoc/module-Settings.html
   * @default {}
   */
  public readonly evaDashConfig = input<EvaDashConfig>({});

  /** The active dash.js player instance. `null` when not initialized or after destruction. */
  private dash: any = null;

  /** Subscription to `EvaApi.playerReadyEvent`. Used to defer setup until the player is ready. */
  private playerReady$: Subscription | null = null;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['evaDashSrc'] && !changes['evaDashSrc'].firstChange) {
      if (changes['evaDashSrc'].currentValue) {
        this.createPlayer();
      } else {
        this.destroyPlayer();
      }
    }
    if (changes['evaDashConfig'] && !changes['evaDashConfig'].firstChange && this.dash) {
      this.dash.updateSettings(this.evaDashConfig());
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
   * Creates and configures a new dash.js player instance.
   *
   * After `STREAM_INITIALIZED`:
   * - Calls `EvaApi.registerQualityLevels()` with the parsed video levels.
   * - Calls `EvaApi.registerQualityFn()` with a bound reference to `setQualityLevel()`
   *   so that `EvaQualitySelector` can switch quality via `EvaApi.setQuality()`.
   *
   * If `evaDashDRMLicenseServer` is provided, DRM protection data is applied
   * before the source is attached. If `evaDashDRMToken` is also provided, it is
   * injected into the `Authorization` header of each DRM request.
   */
  private createPlayer(): void {
    this.destroyPlayer();

    const src = this.evaDashSrc();
    if (!src) { return; }

    const video = this.evaAPI.assignedVideoElement;
    if (!video) { return; }

    this.dash = dashjs.MediaPlayer().create();
    this.dash.updateSettings({
      debug: { logLevel: dashjs.Debug.LOG_LEVEL_NONE },
      ...this.evaDashConfig(),
    });
    this.dash.initialize(video);
    this.dash.setAutoPlay(false);

    this.dash.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
      if (!this.dash) { return; }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const representations: DashRepresentation[] = this.dash.getRepresentationsByType('video');

      if (representations.length > 0) {
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
          ...representations.map(rep => ({
            qualityIndex: rep.index,
            label: rep.height ? `${rep.height}p` : `Level ${rep.index}`,
            width: rep.width ?? 0,
            height: rep.height ?? 0,
            bitrate: rep.bandwidth ?? 0,
            mediaType: 'video' as const,
            frameRate: rep.frameRate,
            ...(rep.codecs ? { codec: rep.codecs } : {}),
          })),
        ];

        this.evaAPI.registerQualityLevels(levels);
        this.evaAPI.registerQualityFn(this.setQualityLevel.bind(this));
      }
    });

    // Apply DRM if configured
    const licenseServer = this.evaDashDRMLicenseServer();
    if (licenseServer) {
      const drmOptions: EvaDRMLicenseServer = {};
      for (const key of Object.keys(licenseServer)) {
        drmOptions[key] = { ...licenseServer[key], httpRequestHeaders: { ...licenseServer[key].httpRequestHeaders } };
      }
      const token = this.evaDashDRMToken();

      if (token) {
        for (const drmSystem of Object.keys(drmOptions)) {
          drmOptions[drmSystem].httpRequestHeaders = {
            ...drmOptions[drmSystem].httpRequestHeaders,
            Authorization: token,
          };
        }
      }

      this.dash.setProtectionData(drmOptions);
    }

    this.dash.attachSource(src);
  }

  private destroyPlayer(): void {
    if (this.dash) {
      this.dash.reset();
      this.dash = null;
    }
  }

  /**
   * Switches to a specific quality level by index.
   * Called internally by `EvaApi.setQuality()` via the registered quality function.
   *
   * - Pass `-1` to restore Auto (ABR) mode — re-enables `autoSwitchBitrate` for video.
   * - Any other index disables ABR and pins the quality via `setRepresentationForTypeByIndex`.
   *
   * @param qualityIndex - The `qualityIndex` from an `EvaQualityLevel` object.
   */
  public setQualityLevel(qualityIndex: number): void {
    if (!this.dash) { return; }

    if (qualityIndex === -1) {
      this.dash.updateSettings({
        streaming: { abr: { autoSwitchBitrate: { video: true } } },
      });
    } else {
      this.dash.updateSettings({
        streaming: { abr: { autoSwitchBitrate: { video: false } } },
      });
      this.dash.setRepresentationForTypeByIndex('video', qualityIndex);
    }
  }

  /**
   * Returns the raw dash.js player instance for advanced use cases.
   * Returns `null` if the player has not been initialized.
   */
  public getDashInstance(): any {
    return this.dash;
  }
}