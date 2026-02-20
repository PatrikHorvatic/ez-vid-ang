import { Directive, inject, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, merge, Subject, Subscription, takeUntil, throttleTime } from 'rxjs';
import { EvaApi } from '../../api/eva-api';

/**
 * Directive that listens for user interaction events on the assigned video element
 * and forwards them to `EvaApi.triggerUserInteraction`, which other components
 * (such as `eva-controls-container` and `eva-scrub-bar`) subscribe to for auto-hide behaviour.
 *
 * Applied as an attribute on `eva-controls-container`:
 * ```html
 * <eva-controls-container evaUserInteractionEvents />
 * ```
 *
 * Listened events (on the native `HTMLVideoElement`):
 * - `mousemove` — throttled to one emission per 100ms to avoid flooding the subject
 * - `touchstart` — fires on any touch interaction
 * - `click` — fires on any pointer click
 *
 * All three streams are merged and piped through `takeUntil(destroy$)` so listeners
 * are automatically removed when the directive is destroyed.
 *
 * If the player is not yet ready on `ngOnInit`, listener setup is deferred until
 * `EvaApi.playerReadyEvent` fires, after which the `playerReady$` subscription
 * is no longer needed and is cleaned up in `ngOnDestroy`.
 *
 * @example
 * <eva-controls-container evaUserInteractionEvents />
 */
@Directive({
  selector: 'eva-controls-container[evaUserInteractionEvents]',
  standalone: false,
})
export class EvaUserInteractionEventsDirective implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);

  /**
   * Emits once on `ngOnDestroy` to complete all RxJS streams set up in `prepareListeners`.
   * Used with `takeUntil` to avoid manual unsubscription of merged event streams.
   */
  private destroy$ = new Subject<void>();

  /**
   * Subscription to `EvaApi.playerReadyEvent`, used when the player is not yet ready
   * on `ngOnInit`. Unsubscribed in `ngOnDestroy`.
   */
  private playerReady$: Subscription | null = null;

  /**
   * Registers user interaction listeners immediately if the player is ready,
   * otherwise defers registration until `EvaApi.playerReadyEvent` fires.
   */
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

  /**
   * Completes `destroy$` to unsubscribe all merged event streams,
   * and cleans up the `playerReady$` subscription if it was used.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.playerReady$) {
      this.playerReady$.unsubscribe();
    }
  }

  /**
   * Attaches `mousemove`, `touchstart`, and `click` listeners to the assigned video element
   * and merges them into a single stream that forwards each event to `EvaApi.triggerUserInteraction`.
   *
   * - `mousemove` is throttled to 100ms to prevent excessive emissions during cursor movement.
   * - All streams are automatically torn down when `destroy$` emits via `takeUntil`.
   */
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