import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EvaApi } from '../../api/eva-api';

@Component({
  selector: 'eva-scrub-bar-current-time',
  templateUrl: './scrub-bar-current-time.component.html',
  styleUrl: './scrub-bar-current-time.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaScrubBarCurrentTimeComponent {
  private evaAPI = inject(EvaApi);

  protected currentTimePercentage = computed(() => {
    let time = this.evaAPI.time();
    if (!time) {
      return "0%";
    }
    // check if it's live
    if (time.total === Infinity) {
      return "100%";
    }
    return Math.round(time.current * 100) / time.total + "%";
  });

}
