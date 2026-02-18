import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { Subscription } from 'rxjs';
import { transformTimeoutDuration } from '../../utils/utilities';

@Component({
  selector: 'eva-scrub-bar',
  templateUrl: './scrub-bar.html',
  styleUrl: './scrub-bar.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "slider",
    "aria-label": "scrub bar",
    "aria-level": "polite",
    "aria-valuemin": "0",
    "aria-valuemax": "100",
    "aria-valuenow": "100",
    "aria-valuetext": "100",
    "[class.hide]": "hideControls()"
  }
})
export class EvaScrubBar implements OnInit, OnDestroy {
  protected evaAPI = inject(EvaApi);

  readonly hideWithControlsContainer = input<boolean>(false);
  readonly evaAutohideTime = input<number, number>(3000, { transform: transformTimeoutDuration });


  protected hideControls: WritableSignal<boolean> = signal(false);

  private userInteraction$: Subscription | null = null;
  //TODO - Add a timeout type!
  /**This is NodeJS.TImeout type! */
  private hideTimeout: any;

  ngOnInit(): void {
    if (this.hideWithControlsContainer()) {
      this.startListening();
    }
  }

  ngOnDestroy(): void {
    if (this.userInteraction$) {
      this.userInteraction$.unsubscribe();
    }
  }

  private startListening() {
    this.userInteraction$ = this.evaAPI.triggerUserInteraction.subscribe(e => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      this.prepareHiding();
    });
  }

  private prepareHiding() {
    this.hideControls.set(false);
    this.hideTimeout = setTimeout(() => {
      this.hideControls.set(true);
    }, this.evaAutohideTime());
  }

}
