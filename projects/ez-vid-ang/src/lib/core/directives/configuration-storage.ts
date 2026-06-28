import { Directive, inject, input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { EvaConfigurationStorage } from '../../api/configuration-storage';
import { EvaStorageConfiguration, validateAndTransformStorageKey } from '../../types';
import { DEFAULT_STORAGE_KEY } from '../../constants';
import { EvaApi } from '../../api/eva-api';
import { Subscription } from 'rxjs';

/**
 * Directive that persists user preferences (volume, playback speed) to
 * `localStorage` and restores them when the player initializes.
 *
 * Applied as a host directive on the `<video>` element inside `EvaPlayer`.
 * All inputs are forwarded from `EvaPlayer`'s own inputs.
 *
 * Feature flags in `evaLocalStorageConfiguration` control which preferences
 * are persisted. Each flag can be toggled at runtime — subscriptions are
 * created or torn down independently without affecting the other.
 *
 * Lifecycle:
 * 1. When `evaLocalStorageEnabled` becomes `true`, the directive waits for
 *    `playerReadyEvent` (or acts immediately if the player is already ready).
 * 2. Saved values are restored once via `EvaApi.setVideoVolume()` /
 *    `EvaApi.setPlaybackSpeed()`. Config-set values (e.g. `startingVolume`)
 *    are applied first by `EvaVideoConfigurationDirective`, then overwritten
 *    by the stored preference — so the user's last choice always wins.
 * 3. Subscriptions to `videoVolumeSubject` / `playbackRateSubject` are
 *    created to persist future changes.
 * 4. When `evaLocalStorageEnabled` becomes `false`, all subscriptions are
 *    torn down. Stored values remain in `localStorage` for the next session.
 *
 * Volume `0` (muted) is intentionally not persisted to avoid restoring
 * a muted state the user did not intend to keep.
 */
@Directive({
  selector: '[evaConfigurationStorage]',
})
export class ConfigurationStorage implements OnChanges, OnDestroy {
  private readonly storage: EvaConfigurationStorage = inject(EvaConfigurationStorage);
  private readonly evaAPI = inject(EvaApi);

  /**
   * Master toggle for localStorage persistence.
   * When `false`, no values are saved or restored and all subscriptions are inactive.
   *
   * **Required.** Forwarded from `EvaPlayer.evaLocalStorageEnabled`.
   */
  public readonly evaLocalStorageEnabled = input.required<boolean>();

  /**
   * Prefix used for all localStorage keys.
   * Allows multiple player instances to store independent preferences.
   *
   * @default "EVA_PLAYER_CONFIGURATION"
   */
  public readonly evaLocalStorageKey = input<string, string>(DEFAULT_STORAGE_KEY, { transform: validateAndTransformStorageKey });

  /**
   * Granular feature flags controlling which preferences are persisted.
   * Each flag can be toggled at runtime.
   *
   * **Required.** Forwarded from `EvaPlayer.evaLocalStorageConfiguration`.
   */
  public readonly evaLocalStorageConfiguration = input.required<Required<EvaStorageConfiguration>>();

  /** Subscription to `videoVolumeSubject`. Active only when `config.volume` is `true`. */
  private volumeSub: Subscription | null = null;

  /** Subscription to `playbackRateSubject`. Active only when `config.playbackSpeed` is `true`. */
  private playbackSpeedSub: Subscription | null = null;

  /** Subscription to `cinemaModeSubject`. Active only when `config.cinemaMode` is `true`. */
  private cinemaModeSub: Subscription | null = null;

  /** Subscription to `loopSubject`. Active only when `config.loop` is `true`. */
  private loopSub: Subscription | null = null;

  /** Subscription to `playerReadyEvent`. Used to defer restore until the player is ready. */
  private playerReadySub: Subscription | null = null;

  /** Prevents restoring values more than once per directive lifetime. */
  private hasRestoredValues = false;

  /**
   * Responds to runtime changes of `evaLocalStorageEnabled` and `evaLocalStorageConfiguration`.
   *
   * - `evaLocalStorageEnabled` toggled to `true` → enables persistence and restores saved values.
   * - `evaLocalStorageEnabled` toggled to `false` → tears down all subscriptions.
   * - `evaLocalStorageConfiguration` changed while enabled → syncs subscriptions to match the new flags.
   */
  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['evaLocalStorageEnabled']) {
      if (changes['evaLocalStorageEnabled'].currentValue) {
        this.enable();
      } else {
        this.disable();
      }
      return;
    }

    if (changes['evaLocalStorageConfiguration'] && this.evaLocalStorageEnabled()) {
      this.syncSubscriptions();
    }
  }

  public ngOnDestroy(): void {
    this.disable();
  }

  /** Waits for the player to be ready, then restores values and starts listening. */
  private enable(): void {
    if (!this.evaAPI.isPlayerReady) {
      this.playerReadySub?.unsubscribe();
      this.playerReadySub = this.evaAPI.playerReadyEvent.subscribe(() => {
        this.restoreValues();
        this.syncSubscriptions();
        this.playerReadySub?.unsubscribe();
        this.playerReadySub = null;
      });
    } else {
      this.restoreValues();
      this.syncSubscriptions();
    }
  }

  /** Tears down all active subscriptions. */
  private disable(): void {
    this.playerReadySub?.unsubscribe();
    this.playerReadySub = null;
    this.volumeSub?.unsubscribe();
    this.volumeSub = null;
    this.playbackSpeedSub?.unsubscribe();
    this.playbackSpeedSub = null;
    this.cinemaModeSub?.unsubscribe();
    this.cinemaModeSub = null;
    this.loopSub?.unsubscribe();
    this.loopSub = null;
  }

  /**
   * Creates or tears down individual subscriptions based on the current
   * `evaLocalStorageConfiguration` flags. Called on init and whenever
   * the configuration changes at runtime.
   */
  private syncSubscriptions(): void {
    const config = this.evaLocalStorageConfiguration();

    if (config.volume && !this.volumeSub) {
      this.volumeSub = this.evaAPI.videoVolumeSubject.subscribe((volume: number | null) => {
        if (volume !== null && volume > 0) {
          this.storage.saveVolume(this.evaLocalStorageKey(), volume);
        }
      });
    } else if (!config.volume && this.volumeSub) {
      this.volumeSub.unsubscribe();
      this.volumeSub = null;
    }

    if (config.playbackSpeed && !this.playbackSpeedSub) {
      this.playbackSpeedSub = this.evaAPI.playbackRateSubject.subscribe((speed: number | null) => {
        if (speed !== null) {
          this.storage.savePlaybackSpeed(this.evaLocalStorageKey(), speed);
        }
      });
    } else if (!config.playbackSpeed && this.playbackSpeedSub) {
      this.playbackSpeedSub.unsubscribe();
      this.playbackSpeedSub = null;
    }

    if (config.cinemaMode && !this.cinemaModeSub) {
      this.cinemaModeSub = this.evaAPI.cinemaModeSubject.subscribe((active: boolean) => {
        this.storage.saveCinemaMode(this.evaLocalStorageKey(), active);
      });
    } else if (!config.cinemaMode && this.cinemaModeSub) {
      this.cinemaModeSub.unsubscribe();
      this.cinemaModeSub = null;
    }

    if (config.loop && !this.loopSub) {
      this.loopSub = this.evaAPI.loopSubject.subscribe((active: boolean) => {
        this.storage.saveLoop(this.evaLocalStorageKey(), active);
      });
    } else if (!config.loop && this.loopSub) {
      this.loopSub.unsubscribe();
      this.loopSub = null;
    }
  }

  /**
   * Reads saved values from localStorage and applies them via `EvaApi`.
   * Runs once per directive lifetime, after the player is ready.
   * Skipped values (missing or invalid) fall back to whatever the
   * config directive or browser default already set.
   */
  private restoreValues(): void {
    if (this.hasRestoredValues) {
      return;
    }
    this.hasRestoredValues = true;

    const config = this.evaLocalStorageConfiguration();
    const key = this.evaLocalStorageKey();

    if (config.volume) {
      const savedVolume: number | null = this.storage.getVolume(key);
      if (savedVolume !== null) {
        this.evaAPI.setVideoVolume(savedVolume);
      }
    }

    if (config.playbackSpeed) {
      const savedSpeed: number | null = this.storage.getPlaybackSpeed(key);
      if (savedSpeed !== null) {
        this.evaAPI.setPlaybackSpeed(savedSpeed);
      }
    }

    if (config.cinemaMode) {
      const savedCinema: boolean | null = this.storage.getCinemaMode(key);
      if (savedCinema !== null) {
        this.evaAPI.cinemaModeSubject.next(savedCinema);
      }
    }

    if (config.loop) {
      const savedLoop: boolean | null = this.storage.getLoop(key);
      if (savedLoop !== null && this.evaAPI.assignedVideoElement) {
        this.evaAPI.assignedVideoElement.loop = savedLoop;
        this.evaAPI.loopSubject.next(savedLoop);
      }
    }
  }
}
