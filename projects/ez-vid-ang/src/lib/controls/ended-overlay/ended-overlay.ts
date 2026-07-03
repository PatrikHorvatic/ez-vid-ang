import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaState } from '../../types';
import { EvaEndedOverlayAria, EvaEndedOverlayAriaTransformed, transformEvaEndedOverlayAria } from '../../utils/aria-utilities';

/**
 * Ended overlay component for the Eva video player.
 *
 * Covers the full player area and becomes visible when the video reaches
 * `EvaState.ENDED`. The overlay is a transparent container — all content is
 * supplied by the consumer via content projection (`<ng-content />`), giving
 * full control over what is displayed (replay button, next-video card, social
 * share prompts, etc.).
 *
 * The overlay is suppressed when `HTMLVideoElement.loop` is `true` to prevent
 * a flash of the ended state before the video loops back to the beginning.
 *
 * Visibility is driven by `EvaApi.videoStateSubject` — no consumer wiring
 * is required. The subscription is cleaned up in `ngOnDestroy`.
 *
 * @example
 * // Minimal — project a replay button
 * <eva-ended-overlay>
 *   <button (click)="replay()">Replay</button>
 * </eva-ended-overlay>
 *
 * @example
 * // With custom ARIA label
 * <eva-ended-overlay [evaAria]="{ ariaLabel: 'Video finished' }">
 *   <div class="end-card">...</div>
 * </eva-ended-overlay>
 */
@Component({
  selector: 'eva-ended-overlay',
  templateUrl: './ended-overlay.html',
  styleUrl: './ended-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "role": "alert",
    "[attr.aria-label]": "evaAria().ariaLabel",
    "[class.eva-ended-overlay-visible]": "isVisible()",
  }
})
export class EvaEndedOverlay implements OnInit, OnDestroy {
  private readonly evaAPI = inject(EvaApi);

  /**
   * ARIA label for the overlay container (`role="alert"`).
   *
   * All properties are optional — default values are applied via `transformEvaEndedOverlayAria`:
   * - `ariaLabel` → `"Video ended"`
   */
  public readonly evaAria = input<EvaEndedOverlayAriaTransformed, EvaEndedOverlayAria>(transformEvaEndedOverlayAria(undefined), { transform: transformEvaEndedOverlayAria });

  /** Whether the overlay is currently visible. Applies `eva-ended-overlay-visible` to the host. */
  protected readonly isVisible = signal(false);

  /** Subscription to video state changes. Cleaned up in `ngOnDestroy`. */
  private stateSub: Subscription | null = null;

  /**
   * Subscribes to `EvaApi.videoStateSubject` and shows the overlay when
   * the state is `EvaState.ENDED`, unless the video is set to loop.
   */
  public ngOnInit(): void {
    this.stateSub = this.evaAPI.videoStateSubject.subscribe(state => {
      if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) {
        return;
      }
      // Prevent flashing if video is set on loop
      if (!this.evaAPI.assignedVideoElement!.loop) {
        this.isVisible.set(state === EvaState.ENDED);
      }
    });
  }

  /** Unsubscribes from state changes to prevent memory leaks. */
  public ngOnDestroy(): void {
    this.stateSub?.unsubscribe();
  }

}
