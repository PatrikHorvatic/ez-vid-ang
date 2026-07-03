import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { DEFAULT_SEEK_SECONDS } from '../../constants';
import { EvaIcon } from '../../core/icon/icon';
import { EvaBackwardAria, EvaBackwardAriaTransformed, transformEvaBackwardAria, validateAndTransformEvaForwardAndBackwardSeconds } from '../../utils/aria-utilities';


/**
 * Backward seek button component for the Eva video player.
 *
 * Renders as a `role="button"` element with `tabindex="0"` that seeks the video
 * backward by a configurable number of seconds when clicked.
 *
 * The default icon is resolved from the Eva icon registry based on `evaBackwardSeconds`:
 * - `backward-10` — when `evaBackwardSeconds` is `10`
 * - `backward-30` — when `evaBackwardSeconds` is `30`
 *
 * Register icons with `addEvaIcons` before using the component. Use `evaCustomIcon`
 * to suppress the registry icon and project your own content instead.
 *
 * Keyboard support: `Enter` and `Space` trigger the backward seek.
 *
 * @example
 * // Register icons once (e.g. in main.ts or app config)
 * import { addEvaIcons } from 'ez-vid-ang';
 * import { evaBackward10Icon, evaBackward30Icon } from 'ez-vid-ang/icons';
 * addEvaIcons({ evaBackward10Icon, evaBackward30Icon });
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
  imports: [EvaIcon],
  templateUrl: './backward.html',
  styleUrl: './backward.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "evaAria().ariaLabel",
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
   * When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead,
   * allowing you to project a custom backward-seek icon.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  /**
   * Number of seconds to seek backward on click.
   * Validated via `validateAndTransformEvaForwardAndBackwardSeconds`.
   *
   * Determines which registry icon is shown:
   * - `10` → `backward-10`
   * - `30` → `backward-30`
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