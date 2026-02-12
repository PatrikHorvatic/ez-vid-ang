import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'eva-time-display',
  templateUrl: './time-display.html',
  styleUrl: './time-display.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaTimeDisplay {

}
