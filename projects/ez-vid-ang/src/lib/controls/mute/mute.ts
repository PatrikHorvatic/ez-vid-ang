import { ChangeDetectionStrategy, Component, computed, inject, input, signal, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { transformEvaMuteAria, validateAndTransformVolumeRange, EvaMuteAria, EvaMuteAriaTransformed } from '../../utils/aria-utilities';
import { DEFAULT_LOW_VOLUME_THRESHOLD, DEFAULT_MIDDLE_VOLUME_THRESHOLD } from '../../constants';

/**
 * Mute/unmute button component for the Eva video player.
 *
 * Renders as a `role="button"` element with `tabindex="0"`, making it focusable
 * and keyboard accessible without a native `<button>` element.
 *
 * The component reflects the current video volume through four built-in icon states:
 * - `eva-icon-volume_up` — volume >= `evaMiddleVolume`
 * - `eva-icon-volume_middle` — volume >= `evaLowVolume` and < `evaMiddleVolume`
 * - `eva-icon-volume_low` — volume > 0 and < `evaLowVolume`
 * - `eva-icon-volume_off` — volume is 0
 *
 * Built-in icons can be suppressed with `evaCustomIcon` to use your own.
 *
 * Keyboard support: `Enter` and `Space` toggle mute/unmute.
 *
 * @example
 * // Minimal usage
 * <eva-mute />
 *
 * @example
 * // Custom ARIA labels
 * <eva-mute [evaAria]="{ ariaLabel: 'Toggle sound', ariaValueTextMuted: 'Sound off', ariaValueTextUnmuted: 'Sound on' }" />
 *
 * @example
 * // Custom icon with adjusted thresholds
 * <eva-mute [evaCustomIcon]="true" [evaLowVolume]="0.33" [evaMiddleVolume]="0.66">
 *   <p evaVolumeOff>Off</p>
 *   <p evaVolumeLow>Low</p>
 *   <p evaVolumeMiddle>Middle</p>
 *   <p evaVolumeUp>Up</p>
 * </eva-mute>
 */
@Component({
  selector: 'eva-mute',
  templateUrl: './mute.html',
  styleUrl: './mute.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "muteAriaLabel()",
    "[attr.aria-valuetext]": "muteAriaValueText()",
    "[class.eva-icon]": "!evaCustomIcon()",
    "[class.eva-icon-volume_up]": "!evaCustomIcon() && evaIconVolumeUp()",
    "[class.eva-icon-volume_middle]": "!evaCustomIcon() && evaIconVolumeMiddle()",
    "[class.eva-icon-volume_low]": "!evaCustomIcon() && evaIconVolumeLow()",
    "[class.eva-icon-volume_off]": "!evaCustomIcon() && evaIconVolumeOff()",
    "(click)": "muteClicked()",
    "(keydown)": "muteClickKeyboard($event)"
  }
})
export class EvaMute implements OnInit, OnDestroy {
  private readonly evaAPI = inject(EvaApi);

  /**
   * ARIA labels and value texts for the button.
   *
   * All properties are optional — default values are applied via `transformEvaMuteAria`:
   * - `ariaLabel` → `"mute"`
   * - `ariaValueTextMuted` → `"Muted"`
   * - `ariaValueTextUnmuted` → `"Unmuted"`
   */
  public readonly evaAria = input<EvaMuteAriaTransformed, EvaMuteAria>(transformEvaMuteAria(undefined), { transform: transformEvaMuteAria });

  /**
   * When `true`, suppresses all built-in icon classes (`eva-icon`, `eva-icon-volume_*`)
   * so you can provide your own icon.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  /**
   * Volume threshold below which the low volume icon (`eva-icon-volume_low`) is shown.
   * Accepts a value between `0` and `1`. Values outside this range are clamped.
   *
   * @default 0.25
   */
  public readonly evaLowVolume = input<number, number>(DEFAULT_LOW_VOLUME_THRESHOLD, { transform: validateAndTransformVolumeRange });

  /**
   * Volume threshold at or above which the high volume icon (`eva-icon-volume_up`) is shown.
   * Accepts a value between `0` and `1`. Values outside this range are clamped.
   *
   * @default 0.75
   */
  public readonly evaMiddleVolume = input<number, number>(DEFAULT_MIDDLE_VOLUME_THRESHOLD, { transform: validateAndTransformVolumeRange });

  /** Resolves the `aria-label` from the transformed aria input. */
  protected readonly muteAriaLabel = computed<string>(() => this.evaAria().ariaLabel);

  /** Resolves the `aria-valuetext` based on the current volume — muted or unmuted. */
  protected readonly muteAriaValueText = computed<string>(() => this.videoVolume() > 0
    ? this.evaAria().ariaValueTextUnmuted
    : this.evaAria().ariaValueTextMuted);

  /** `true` when volume is >= `evaMiddleVolume`. Applies `eva-icon-volume_up`. */
  protected readonly evaIconVolumeUp = computed<boolean>(() => this.videoVolume() >= this.evaMiddleVolume());

  /** `true` when volume is >= `evaLowVolume` and < `evaMiddleVolume`. Applies `eva-icon-volume_middle`. */
  protected readonly evaIconVolumeMiddle = computed<boolean>(() => this.videoVolume() >= this.evaLowVolume() && this.videoVolume() < this.evaMiddleVolume());

  /** `true` when volume is > `0` and < `evaLowVolume`. Applies `eva-icon-volume_low`. */
  protected readonly evaIconVolumeLow = computed<boolean>(() => this.videoVolume() > 0 && this.videoVolume() < this.evaLowVolume());

  /** `true` when volume is `0`. Applies `eva-icon-volume_off`. */
  protected readonly evaIconVolumeOff = computed<boolean>(() => !this.videoVolume());

  /** Reactive signal holding the current video volume. */
  protected readonly videoVolume = signal(0);

  /** Subscription to volume changes from `EvaApi`. Cleaned up in `ngOnDestroy`. */
  private videoVolumeSub: Subscription | null = null;

  /**
   * Initializes `videoVolume` with the current volume from `EvaApi` and subscribes
   * to `videoVolumeSubject` to keep the signal in sync with external volume changes.
   */
  public ngOnInit(): void {
    this.videoVolume.set(this.evaAPI.getVideoVolume());
    this.videoVolumeSub = this.evaAPI.videoVolumeSubject.subscribe(volume => {
      if (volume !== null) {
        this.videoVolume.set(volume);
      }
    })
  }

  /** Unsubscribes from the volume subscription to prevent memory leaks. */
  public ngOnDestroy(): void {
    this.videoVolumeSub?.unsubscribe();
  }

  /** Delegates mute/unmute toggling to `EvaApi`. */
  protected muteClicked(): void {
    this.evaAPI.muteOrUnmuteVideo()
  }

  /**
   * Handles keyboard events on the host element.
   * Triggers mute/unmute on `Enter` or `Space` keypress.
   */
  protected muteClickKeyboard(k: KeyboardEvent): void {
    if (k.key === 'Enter' || k.key === ' ') {
      k.preventDefault();
      this.muteClicked();
    }
  }
}