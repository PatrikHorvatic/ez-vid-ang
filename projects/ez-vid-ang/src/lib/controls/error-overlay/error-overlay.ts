import { ChangeDetectionStrategy, Component, inject, input, output, signal, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaState } from '../../types';
import { transformEvaErrorOverlayAria, EvaErrorOverlayAria, EvaErrorOverlayAriaTransformed } from '../../utils/aria-utilities';

/**
 * Error overlay component for the Eva video player.
 *
 * Displays a user-facing error message with a retry button when the video
 * enters the `EvaState.ERROR` state. Covers the full video area and sits
 * above the overlay play button (`z-index: 500`).
 *
 * The overlay appears automatically when `videoStateSubject` emits `ERROR`
 * and hides when the state changes to anything else (e.g. after a
 * successful retry).
 *
 * On retry click:
 * 1. Emits `evaRetryClicked` so the consumer can perform custom retry
 *    logic (e.g. switch to a fallback source).
 * 2. If the consumer does not prevent default behavior, reloads the
 *    current video source via `videoElement.load()`.
 *
 * Supports full content projection via `evaCustomContent` — when `true`,
 * the built-in error message and retry button are replaced with the
 * consumer's projected content.
 *
 * @example
 * // Default error overlay
 * <eva-error-overlay />
 *
 * @example
 * // Custom error message
 * <eva-error-overlay
 *   evaErrorText="Oops! Something went wrong."
 *   evaRetryText="Try Again"
 * />
 *
 * @example
 * // Fully custom content
 * <eva-error-overlay [evaCustomContent]="true">
 *   <div class="my-error">
 *     <p>Custom error message</p>
 *     <button (click)="handleRetry()">Retry</button>
 *   </div>
 * </eva-error-overlay>
 *
 * @example
 * // Listen for retry events
 * <eva-error-overlay (evaRetryClicked)="onRetry()" />
 */
@Component({
  selector: 'eva-error-overlay',
  templateUrl: './error-overlay.html',
  styleUrl: './error-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "role": "alert",
    "[attr.aria-label]": "evaAria().ariaLabel",
    "[class.eva-error-overlay-visible]": "isVisible()",
  }
})
export class EvaErrorOverlay implements OnInit, OnDestroy {
  protected readonly evaAPI = inject(EvaApi);

  /**
   * Error message displayed to the user.
   *
   * @default "An error occurred during video playback."
   */
  public readonly evaErrorText = input<string>('An error occurred during video playback.');

  /**
   * Label on the retry button.
   *
   * @default "Retry"
   */
  public readonly evaRetryText = input<string>('Retry');

  /**
   * When `true`, hides the built-in error message and retry button,
   * rendering projected content instead.
   *
   * @default false
   */
  public readonly evaCustomContent = input<boolean>(false);

  /**
   * ARIA labels for the overlay and retry button.
   *
   * @default { ariaLabel: "Video playback error", retryAriaLabel: "Retry playback" }
   */
  public readonly evaAria = input<EvaErrorOverlayAriaTransformed, EvaErrorOverlayAria>(transformEvaErrorOverlayAria(undefined), { transform: transformEvaErrorOverlayAria });

  /**
   * Emitted when the retry button is clicked. The consumer can perform
   * custom retry logic (e.g. switch sources). After emitting, the
   * component always calls `videoElement.load()` to reload the current sources.
   */
  public readonly evaRetryClicked = output();

  /** Whether the error overlay is currently visible. */
  protected readonly isVisible = signal(false);

  private stateSub: Subscription | null = null;

  public ngOnInit(): void {
    this.stateSub = this.evaAPI.videoStateSubject.subscribe(state => {
      this.isVisible.set(state === EvaState.ERROR);
    });
  }

  public ngOnDestroy(): void {
    this.stateSub?.unsubscribe();
  }

  /** Emits `evaRetryClicked` and reloads the video source. */
  protected onRetry(): void {
    this.evaRetryClicked.emit();
    this.evaAPI.assignedVideoElement?.load();
  }
}
