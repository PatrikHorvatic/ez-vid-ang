import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { transformEvaBackwardAria, validateAndTransformEvaForwardAndBackwardSeconds, EvaBackwardAria, EvaBackwardAriaTransformed } from '../../utils/aria-utilities';
import { DEFAULT_SEEK_SECONDS } from '../../constants';


/**
 * Backward seek button component for the Eva video player.
 *
 * Renders as a `role="button"` element with `tabindex="0"` that seeks the video
 * backward by a configurable number of seconds when clicked.
 *
 * Built-in icon classes are applied based on the value of `evaBackwardSeconds`:
 * - `eva-icon-replay_10` — when `evaBackwardSeconds` is `10`
 * - `eva-icon-replay_30` — when `evaBackwardSeconds` is `30`
 *
 * Both can be suppressed via `evaCustomIcon` to use your own icon.
 *
 * Keyboard support: `Enter` and `Space` trigger the backward seek.
 *
 * @example
 * // Default — seek backward 10 seconds
 * <eva-backward />
 *
 * @example
 * // Seek backward 30 seconds
 * <eva-backward [evaBackwardSeconds]="30" />
 *
 * @example
 * // Custom icon and ARIA label
 * <eva-backward
 *   [evaCustomIcon]="true"
 *   [evaAria]="{ ariaLabel: 'Rewind 10 seconds' }"
 * />
 */
@Component({
  selector: 'eva-backward',
  templateUrl: './backward.html',
  styleUrl: './backward.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "evaAria().ariaLabel",
    "[class.eva-icon]": "!evaCustomIcon()",
    "[class.eva-icon-replay_10]": "!evaCustomIcon() && evaBackwardSeconds() === 10",
    "[class.eva-icon-replay_30]": "!evaCustomIcon() && evaBackwardSeconds() === 30",
    "(click)": "backwardClicked()",
    "(keydown)": "backwardClickedKeyboard($event)"
  }
})
export class EvaBackward {
  private readonly evaAPI = inject(EvaApi);

  /**
   * ARIA label for the backward button.
   *
   * All properties are optional — default values are applied via `transformEvaBackwardAria`.
   */
  public readonly evaAria = input<EvaBackwardAriaTransformed, EvaBackwardAria>(transformEvaBackwardAria(undefined), { transform: transformEvaBackwardAria });

  /**
   * When `true`, suppresses all built-in icon classes (`eva-icon`, `eva-icon-replay_10`, `eva-icon-replay_30`)
   * so you can provide your own icon.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  /**
   * Number of seconds to seek backward on click.
   * Validated via `validateAndTransformEvaForwardAndBackwardSeconds`.
   *
   * Affects which built-in icon class is applied:
   * - `10` → `eva-icon-replay_10`
   * - `30` → `eva-icon-replay_30`
   *
   * @default 10
   */
  public readonly evaBackwardSeconds = input<number, number>(DEFAULT_SEEK_SECONDS, { transform: validateAndTransformEvaForwardAndBackwardSeconds });

  /** Seeks the video backward by `evaBackwardSeconds` seconds via `EvaApi`. */
  protected backwardClicked(): void {
    this.evaAPI.seekBack(this.evaBackwardSeconds());
  }

  /**
   * Handles keyboard events on the host element.
   * Triggers the backward seek on `Enter` or `Space` keypress.
   */
  protected backwardClickedKeyboard(k: KeyboardEvent): void {
    if (k.key === 'Enter' || k.key === ' ') {
      k.preventDefault();
      this.backwardClicked();
    }
  }
}