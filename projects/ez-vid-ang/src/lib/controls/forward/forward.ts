import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { transformEvaForwardAria, validateAndTransformEvaForwardAndBackwardSeconds, EvaForwardAria, EvaForwardAriaTransformed } from '../../utils/aria-utilities';
import { DEFAULT_SEEK_SECONDS } from '../../constants';


/**
 * Forward seek button component for the Eva video player.
 *
 * Renders as a `role="button"` element with `tabindex="0"` that seeks the video
 * forward by a configurable number of seconds when clicked.
 *
 * Built-in icon classes are applied based on the value of `evaForwardSeconds`:
 * - `eva-icon-forward_10` — when `evaForwardSeconds` is `10`
 * - `eva-icon-forward_30` — when `evaForwardSeconds` is `30`
 *
 * Both can be suppressed via `evaCustomIcon` to use your own icon.
 *
 * Keyboard support: `Enter` and `Space` trigger the forward seek.
 *
 * @example
 * // Default — seek forward 10 seconds
 * <eva-forward />
 *
 * @example
 * // Seek forward 30 seconds
 * <eva-forward [evaForwardSeconds]="30" />
 *
 * @example
 * // Custom icon and ARIA label
 * <eva-forward
 *   [evaCustomIcon]="true"
 *   [evaAria]="{ ariaLabel: 'Skip forward 10 seconds' }"
 * />
 */
@Component({
  selector: 'eva-forward',
  templateUrl: './forward.html',
  styleUrl: './forward.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "evaAria().ariaLabel",
    "[class.eva-icon]": "!evaCustomIcon()",
    "[class.eva-icon-forward_10]": "!evaCustomIcon() && evaForwardSeconds() === 10",
    "[class.eva-icon-forward_30]": "!evaCustomIcon() && evaForwardSeconds() === 30",
    "(click)": "forwardClicked()",
    "(keydown)": "forwardClickedKeyboard($event)"
  }
})
export class EvaForward {
  private readonly evaAPI = inject(EvaApi);

  /**
   * ARIA label for the forward button.
   *
   * All properties are optional — default values are applied via `transformEvaForwardAria`.
   */
  public readonly evaAria = input<EvaForwardAriaTransformed, EvaForwardAria>(transformEvaForwardAria(undefined), { transform: transformEvaForwardAria });

  /**
   * When `true`, suppresses all built-in icon classes (`eva-icon`, `eva-icon-forward_10`, `eva-icon-forward_30`)
   * so you can provide your own icon.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  /**
   * Number of seconds to seek forward on click.
   * Validated via `validateAndTransformEvaForwardAndBackwardSeconds`.
   *
   * Affects which built-in icon class is applied:
   * - `10` → `eva-icon-forward_10`
   * - `30` → `eva-icon-forward_30`
   *
   * @default 10
   */
  public readonly evaForwardSeconds = input<number, number>(DEFAULT_SEEK_SECONDS, { transform: validateAndTransformEvaForwardAndBackwardSeconds });

  /** Seeks the video forward by `evaForwardSeconds` seconds via `EvaApi`. */
  protected forwardClicked(): void {
    this.evaAPI.seekForward(this.evaForwardSeconds());
  }

  /**
   * Handles keyboard events on the host element.
   * Triggers the forward seek on `Enter` (13) or `Space` (32) keypress.
   */
  protected forwardClickedKeyboard(k: KeyboardEvent): void {
    if (k.key === 'Enter' || k.key === ' ') {
      k.preventDefault();
      this.forwardClicked();
    }
  }
}