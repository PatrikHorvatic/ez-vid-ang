import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { DEFAULT_SEEK_SECONDS } from '../../constants';
import { EvaIcon } from '../../core/icon/icon';
import { EvaForwardAria, EvaForwardAriaTransformed, transformEvaForwardAria, validateAndTransformEvaForwardAndBackwardSeconds } from '../../utils/aria-utilities';


/**
 * Forward seek button component for the Eva video player.
 *
 * Renders as a `role="button"` element with `tabindex="0"` that seeks the video
 * forward by a configurable number of seconds when clicked.
 *
 * The default icon is resolved from the Eva icon registry based on `evaForwardSeconds`:
 * - `forward-10` — when `evaForwardSeconds` is `10`
 * - `forward-30` — when `evaForwardSeconds` is `30`
 *
 * Register icons with `addEvaIcons` before using the component. Use `evaCustomIcon`
 * to suppress the registry icon and project your own content instead.
 *
 * Keyboard support: `Enter` and `Space` trigger the forward seek.
 *
 * @example
 * // Register icons once (e.g. in main.ts or app config)
 * import { addEvaIcons } from 'ez-vid-ang';
 * import { evaForward10Icon, evaForward30Icon } from 'ez-vid-ang/icons';
 * addEvaIcons({ evaForward10Icon, evaForward30Icon });
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
  imports: [EvaIcon],
  templateUrl: './forward.html',
  styleUrl: './forward.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "evaAria().ariaLabel",
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
   * When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead,
   * allowing you to project a custom forward-seek icon.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  /**
   * Number of seconds to seek forward on click.
   * Validated via `validateAndTransformEvaForwardAndBackwardSeconds`.
   *
   * Determines which registry icon is shown:
   * - `10` → `forward-10`
   * - `30` → `forward-30`
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