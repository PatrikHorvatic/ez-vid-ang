import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EvaControlsDividerAria, EvaControlsDividerAriaTransformed, transformEvaControlsDividerAria } from '../../utils/aria-utilities';

@Component({
  selector: 'eva-controls-divider',
  templateUrl: './controls-divider.component.html',
  styleUrl: './controls-divider.component.scss',
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
export class EvaControlsDividerComponent {
  readonly evaAria = input<EvaControlsDividerAriaTransformed, EvaControlsDividerAria>(transformEvaControlsDividerAria(undefined), { transform: transformEvaControlsDividerAria });
}
