import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EvaControlsDividerAria, EvaControlsDividerAriaTransformed, transformEvaControlsDividerAria } from '../../utils/aria-utilities';

/**
 * Visual and semantic separator component for the Eva player controls bar.
 *
 * Renders as a `role="separator"` element with horizontal orientation, providing
 * both visual spacing and accessible structure between groups of controls inside
 * `eva-controls-container`.
 *
 * @example
 * // Used to visually and semantically separate control groups
 * <eva-controls-container>
 *   <eva-play-pause />
 *   <eva-time-display evaTimeProperty="current" evaTimeFormating="mm:ss" />
 *
 *   <eva-controls-divider />
 *
 *   <eva-volume />
 *   <eva-fullscreen />
 * </eva-controls-container>
 *
 * @example
 * // With a custom ARIA label
 * <eva-controls-divider [evaAria]="{ ariaLabel: 'Section divider' }" />
 */
@Component({
  selector: 'eva-controls-divider',
  templateUrl: './controls-divider.html',
  styleUrl: './controls-divider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "separator",
    "aria-orientation": "horizontal",
    "aria-valuemin": "0",
    "aria-valuemax": "100",
    "[attr.aria-label]": "evaAria().ariaLabel"
  }
})
export class EvaControlsDivider {
  /**
   * ARIA label for the separator element.
   *
   * All properties are optional — default values are applied via `transformEvaControlsDividerAria`:
   * - `ariaLabel` → `"Controls divider"`
   */
  readonly evaAria = input<EvaControlsDividerAriaTransformed, EvaControlsDividerAria>(transformEvaControlsDividerAria(undefined), { transform: transformEvaControlsDividerAria });
}