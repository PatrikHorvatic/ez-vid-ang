import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaTimeFormating, EvaTimeProperty } from '../../types';

@Component({
  selector: 'eva-time-display',
  templateUrl: './time-display.html',
  styleUrl: './time-display.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaTimeDisplay {
  protected evaAPI = inject(EvaApi);

  readonly evaTimeProperty = input.required<EvaTimeProperty>();
  readonly evaTimeFormating = input.required<EvaTimeFormating>();

  /**Set LIVE text if you need language support */
  readonly evaLiveText = input<string>("LIVE");


}
