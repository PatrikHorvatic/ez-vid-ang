import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'eva-quality-selector',
  templateUrl: './quality-selector.html',
  styleUrl: './quality-selector.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "aria-label": "Quality selector",
    "attr.aria-valuetext": "Quality",
  }
})
export class EvaQualitySelector {

}
