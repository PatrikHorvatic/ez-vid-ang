import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, output, signal, WritableSignal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaChapterMarker } from '../../types';
import { EvaActiveChaptedAria, EvaActiveChaptedAriaTransformed, transformEvaActiveChaptedAria } from '../../utils/aria-utilities';

/**
 * Displays the currently active chapter and emits it when the user interacts with it.
 *
 * Subscribes to `EvaApi.activeChapterSubject` to track which chapter corresponds to
 * the current playback position. The active chapter is updated automatically on every
 * `timeupdate` event by `EvaApi.updateVideoTime()` — no scrubbing or seeking is required.
 *
 * Setting `isActiveChapterPresent` on `EvaApi` to `true` in `ngOnInit` and `false` in
 * `ngOnDestroy` tells the API that a consumer is actively listening, enabling the
 * per-frame chapter lookup inside `updateVideoTime`.
 *
 * Keyboard support:
 * - `Enter` (13) and `Space` (32) trigger the same action as a click.
 *
 * @example
 * // Minimal — displays the active chapter title
 * <eva-active-chapter />
 *
 * @example
 * // With click output — react when the user clicks the active chapter
 * <eva-active-chapter (evaChapterClicked)="onChapterClicked($event)" />
 *
 * @example
 * // With a custom icon slot
 * <eva-active-chapter [evaCustomIcon]="true">
 *   <my-chapter-icon />
 * </eva-active-chapter>
 */
@Component({
  selector: 'eva-active-chapter',
  templateUrl: './active-chapter.component.html',
  styleUrl: './active-chapter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "evaAria().ariaLabel",
    "(click)": "activeChapterClicked()",
    "(keydown)": "activeChapterClickedKeyboard($event)"
  }
})
export class EvaActiveChapter implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);

  /**
   * ARIA label for the active chapter button.
   *
   * All properties are optional — defaults are applied via `transformEvaActiveChaptedAria`.
   */
  readonly evaAria = input<EvaActiveChaptedAriaTransformed, EvaActiveChaptedAria>(
    transformEvaActiveChaptedAria(undefined),
    { transform: transformEvaActiveChaptedAria }
  );

  /**
   * When `true`, suppresses the default icon and allows the consumer to project
   * a custom icon via content projection.
   *
   * @default false
   */
  readonly evaCustomIcon = input<boolean>(false);

  /**
   * Emitted when the user clicks or activates the active chapter via keyboard.
   * Emits the current `EvaChapterMarker`, or `null` if no chapter is active.
   */
  readonly evaChapterClicked = output<EvaChapterMarker | null>();

  /**
   * The `EvaChapterMarker` currently active at the playback position.
   * Updated by `EvaApi.activeChapterSubject` on every `timeupdate`.
   * `null` when the current time does not fall within any chapter.
   */
  protected activeChapter: WritableSignal<EvaChapterMarker | null> = signal(null);

  /** Subscription to `EvaApi.activeChapterSubject`. Cleaned up in `ngOnDestroy`. */
  private chapterSub: Subscription | null = null;

  /** Reserved for future timing-based subscriptions. */
  private timingSub: Subscription | null = null;

  /**
   * Signals to `EvaApi` that this component is present, enabling the per-frame
   * chapter lookup in `EvaApi.updateVideoTime()`. Subscribes to `activeChapterSubject`
   * to keep `activeChapter` in sync with the current playback position.
   */
  ngOnInit(): void {
    this.evaAPI.isActiveChapterPresent = true;
    this.chapterSub = this.evaAPI.activeChapterSubject.subscribe(a => {
      this.activeChapter.set(a);
    });
  }

  /**
   * Signals to `EvaApi` that this component is no longer present, disabling
   * the per-frame chapter lookup. Unsubscribes from all active subscriptions.
   */
  ngOnDestroy(): void {
    this.evaAPI.isActiveChapterPresent = false;
    this.chapterSub?.unsubscribe();
    this.timingSub?.unsubscribe();
  }

  /**
   * Emits `evaChapterClicked` with the current `activeChapter` value.
   * Called on host click and from `activeChapterClickedKeyboard`.
   */
  protected activeChapterClicked() {
    this.evaChapterClicked.emit(this.activeChapter());
  }

  /**
   * Handles keyboard events on the host element.
   * Triggers `activeChapterClicked()` on `Enter` (13) or `Space` (32) keypress.
   *
   * @param k - The native `KeyboardEvent` from the host element.
   */
  protected activeChapterClickedKeyboard(k: KeyboardEvent) {
    if (k.keyCode === 13 || k.keyCode === 32) {
      k.preventDefault();
      this.activeChapterClicked();
    }
  }
}