import { Component, inject, input, Input, OnChanges, OnDestroy, OnInit, signal, SimpleChanges, WritableSignal } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { Subscription } from 'rxjs';
import { transformTimeoutDuration } from '../../utils/utilities';

@Component({
  selector: 'eva-controls-container',
  templateUrl: './controls-container.component.html',
  styleUrl: './controls-container.component.scss',
  standalone: false,
  host: {
    "[class.hide]": "hideControls()"
  }
})
export class EvaControlsContainerComponent implements OnInit, OnDestroy, OnChanges {

  private evaAPI = inject(EvaApi);

  readonly evaAutohide = input<boolean>(false);
  readonly evaAutohideTime = input<number, number>(3000, { transform: transformTimeoutDuration });

  protected hideControls: WritableSignal<boolean> = signal(false);

  private userInteraction$: Subscription | null = null;

  //TODO - Add a timeout type!
  /**This is NodeJS.Timeout type! */
  private hideTimeout: any;


  ngOnInit(): void {
    if (this.evaAutohide()) {
      this.startListening();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["evaAutohide"]) {
      if (!changes["evaAutohide"].firstChange) {
        if (changes["evaAutohide"].currentValue === true) {
          this.startListening();
          this.prepareHiding();
        }
        else {
          this.disableHiding();
        }
      }
    }

    /**TODO - Needs testing */
    if (changes["evaAutohideTime"]) {
      if (!changes["evaAutohideTime"].firstChange) {

      }
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

  private disableHiding() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    if (this.userInteraction$) {
      this.userInteraction$.unsubscribe();
    }
    this.hideControls.set(false);
  }

  private prepareHiding() {
    this.hideControls.set(false);
    this.hideTimeout = setTimeout(() => {
      this.hideControls.set(true);
    }, this.evaAutohideTime());
  }
}
