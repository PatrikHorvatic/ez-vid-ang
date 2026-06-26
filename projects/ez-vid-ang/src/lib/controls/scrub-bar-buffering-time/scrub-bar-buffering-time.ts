import { ChangeDetectionStrategy, Component, inject, signal, OnDestroy, OnInit, WritableSignal } from '@angular/core';
import { throttleTime, Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { BUFFER_UPDATE_THROTTLE_MS, PERCENTAGE } from '../../constants';

/**
 * Buffered time indicator component for the Eva scrub bar.
 *
 * Renders a visual representation of how much of the video has been buffered,
 * expressed as a CSS percentage string (e.g. `"42%"`). Intended to be layered
 * inside `eva-scrub-bar` to show the buffered range behind the playback progress.
 *
 * The buffered percentage is updated from two sources:
 * - `EvaApi.videoBufferSubject` — fires whenever the browser's buffer changes.
 * - `EvaApi.videoTimeChangeSubject` — fires on playback time changes, throttled to
 *   once every 2 seconds to reduce update frequency during active playback.
 *
 * For live streams, the buffered percentage is always set to `"0%"` since buffering
 * progress is not meaningful in a live context.
 *
 * Buffer calculation logic:
 * - If there is exactly one buffered range that spans the entire video (`start === 0`
 *   and `end === total`), the percentage is set to `"100%"`.
 * - Otherwise, the end time of the last buffered range is used to calculate the percentage.
 *
 * @example
 * // Used inside eva-scrub-bar template
 * <eva-scrub-bar-buffering-time />
 */
@Component({
  selector: 'eva-scrub-bar-buffering-time',
  templateUrl: './scrub-bar-buffering-time.html',
  styleUrl: './scrub-bar-buffering-time.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaScrubBarBufferingTime implements OnInit, OnDestroy {
  private readonly evaAPI = inject(EvaApi);

  /** The current buffered amount expressed as a CSS percentage string (e.g. `"42%"`). Bound to the template. */
  protected readonly bufferedPercentage: WritableSignal<string> = signal("0%");

  /** Subscription to buffer change events from `EvaApi`. Cleaned up in `ngOnDestroy`. */
  private bufferSubscription: Subscription | null = null;

  /**
   * Subscription to time change events from `EvaApi`, throttled to once every 2 seconds.
   * Used to keep the buffered percentage in sync during active playback.
   * Cleaned up in `ngOnDestroy`.
   */
  private timeChangeSubscription: Subscription | null = null;

  /**
   * Subscribes to `EvaApi.videoBufferSubject` for buffer changes and to
   * `EvaApi.videoTimeChangeSubject` (throttled at 2000ms) for time changes.
   * Both trigger a recalculation of `bufferedPercentage`.
   */
  public ngOnInit(): void {
    this.bufferSubscription = this.evaAPI.videoBufferSubject.subscribe(() => {
      if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) {
        return;
      }
      this.updateBufferPercentage(this.evaAPI.assignedVideoElement!.buffered);
    });

    this.timeChangeSubscription = this.evaAPI.videoTimeChangeSubject.pipe(throttleTime(BUFFER_UPDATE_THROTTLE_MS)).subscribe(() => {
      if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) {
        return;
      }
      this.updateBufferPercentage(this.evaAPI.assignedVideoElement!.buffered);
    })
  }

  /** Unsubscribes from all active subscriptions to prevent memory leaks. */
  public ngOnDestroy(): void {
    if (this.bufferSubscription) {
      this.bufferSubscription.unsubscribe();
    }
    if (this.timeChangeSubscription) {
      this.timeChangeSubscription.unsubscribe();
    }
  }

  /**
   * Recalculates and updates `bufferedPercentage` based on the video's current `TimeRanges`.
   *
   * Calculation rules:
   * - **Live stream** — always sets `"0%"` and returns early.
   * - **Fully buffered** — if there is exactly one range spanning from `0` to the total duration,
   *   sets `"100%"`.
   * - **Partially buffered** — uses the end time of the last buffered range divided by the total
   *   duration to compute the percentage.
   *
   * See: https://developer.mozilla.org/en-US/docs/Web/API/TimeRanges/length
   *
   * @param tr - The `TimeRanges` object from `HTMLVideoElement.buffered`.
   */
  private updateBufferPercentage(tr: TimeRanges): void {
    let bufferTime = "0%";

    if (this.evaAPI.isLive() || !this.evaAPI.time().total) {
      this.bufferedPercentage.set(bufferTime);
      return;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/TimeRanges/length
    // If
    if (tr.length === 1) {
      // Only one range
      if (tr.start(0) === 0 && tr.end(0) === this.evaAPI.time().total) {
        // The one range starts at the beginning and ends at
        // The end of the video, so the whole thing is loaded
        bufferTime = "100%";
        this.bufferedPercentage.set(bufferTime);
        return;
      }
    }

    if (tr.length - 1 >= 0) {
      bufferTime = `${(tr.end(tr.length - 1) / this.evaAPI.time().total) * PERCENTAGE}%`;
    }

    this.bufferedPercentage.set(bufferTime);
  }
}