import { Directive, inject, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, merge, Subject, Subscription, takeUntil, throttleTime } from 'rxjs';
import { EvaApi } from '../../api/eva-api';

@Directive({
  selector: 'eva-controls-container[evaUserInteractionEvents]',
  standalone: false,
})
export class EvaUserInteractionEventsDirective implements OnInit, OnDestroy {

  private evaAPI = inject(EvaApi);

  private destroy$ = new Subject<void>();
  private playerReady$: Subscription | null = null;

  ngOnInit(): void {
    if (this.evaAPI.isPlayerReady) {
      this.prepareListeners();
    }
    else {
      this.playerReady$ = this.evaAPI.playerReadyEvent.subscribe(v => {
        this.prepareListeners();
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.playerReady$) {
      this.playerReady$.unsubscribe();
    }
  }

  private prepareListeners() {
    const mousemove$ = fromEvent<MouseEvent>(this.evaAPI.assignedVideoElement, 'mousemove')
      .pipe(throttleTime(100));
    const touchstart$ = fromEvent<TouchEvent>(this.evaAPI.assignedVideoElement, 'touchstart');
    const click$ = fromEvent<PointerEvent>(this.evaAPI.assignedVideoElement, 'click');

    // Merge all user interaction events
    merge(mousemove$, touchstart$, click$)
      .pipe(takeUntil(this.destroy$))
      .subscribe((t) => {
        this.evaAPI.triggerUserInteraction.next(t);
      });
  }
}
