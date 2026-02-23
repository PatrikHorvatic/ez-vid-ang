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
    (): { create: () => any };
    events: { STREAM_INITIALIZED: string };
  };
  Debug: { LOG_LEVEL_NONE: number };
};

/**
 * DRM license server configuration for protected DASH streams.
 */
export interface EvaDRMLicenseServer {
  [drmSystem: string]: {
    serverURL: string;
    httpRequestHeaders?: { [key: string]: string };
  };
}

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
  exportAs: 'evaDash',
  standalone: false,
})
export class EvaDashDirective implements OnInit, OnChanges, OnDestroy {
  private evaAPI = inject(EvaApi);

  /**
   * The DASH stream URL (`.mpd` manifest).
   *
   * **Required.** Changing this at runtime destroys the current dash.js instance
   * and creates a new one with the updated source.
   */
  readonly evaDashSrc = input.required<string>();

  /**
   * Authorization token applied to DRM license server request headers.
   * Only used when `evaDashDRMLicenseServer` is also provided.
   *
   * @default undefined
   */
  readonly evaDashDRMToken = input<string | undefined>(undefined);

  /**
   * DRM license server configuration for protected streams.
   * Keys are DRM system strings (e.g. `"com.widevine.alpha"`).
   *
   * @default undefined
   */
  readonly evaDashDRMLicenseServer = input<EvaDRMLicenseServer | undefined>(undefined);

  /** The active dash.js player instance. `null` when not initialized or after destruction. */
  private dash: any = null;

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
    if (changes['evaDashSrc'] && !changes['evaDashSrc'].firstChange) {
      changes['evaDashSrc'].currentValue ? this.createPlayer() : this.destroyPlayer();
    }
  }

  ngOnDestroy(): void {
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
    if (!src || (!src.includes('.mpd') && !src.includes('mpd-time-csf'))) return;

    const video = this.evaAPI.assignedVideoElement;
    if (!video) return;

    this.dash = dashjs.MediaPlayer().create();
    this.dash.updateSettings({ debug: { logLevel: dashjs.Debug.LOG_LEVEL_NONE } });
    this.dash.initialize(video);
    this.dash.setAutoPlay(false);

    this.dash.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
      const videoList = this.dash.getBitrateInfoListFor('video');

      if (videoList.length > 0) {
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
          ...videoList.map((item: any, index: number) => ({
            qualityIndex: index,
            label: item.height ? `${item.height}p` : `Level ${index}`,
            width: item.width ?? 0,
            height: item.height ?? 0,
            bitrate: item.bitrate ?? 0,
            mediaType: 'video' as const,
          })),
        ];

        // Register levels and quality setter with EvaApi
        this.evaAPI.registerQualityLevels(levels);
        this.evaAPI.registerQualityFn(this.setQualityLevel.bind(this));
      }
    });

    // Apply DRM if configured
    const licenseServer = this.evaDashDRMLicenseServer();
    if (licenseServer) {
      const drmOptions = { ...licenseServer };
      const token = this.evaDashDRMToken();

      if (token) {
        for (const drmSystem in drmOptions) {
          if (Object.prototype.hasOwnProperty.call(drmOptions, drmSystem)) {
            drmOptions[drmSystem].httpRequestHeaders = {
              ...drmOptions[drmSystem].httpRequestHeaders,
              Authorization: token,
            };
          }
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
   * - Any other index disables ABR and sets the quality directly via `setQualityFor`.
   *
   * @param qualityIndex - The `qualityIndex` from an `EvaQualityLevel` object.
   */
  public setQualityLevel(qualityIndex: number): void {
    if (!this.dash) return;

    if (qualityIndex === -1) {
      // Restore Auto (ABR) mode
      this.dash.updateSettings({
        streaming: {
          abr: {
            autoSwitchBitrate: { video: true },
          },
        },
      });
    } else {
      // Disable ABR and set quality manually
      this.dash.updateSettings({
        streaming: {
          abr: {
            autoSwitchBitrate: { video: false },
          },
        },
      });
      this.dash.setQualityFor('video', qualityIndex);
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