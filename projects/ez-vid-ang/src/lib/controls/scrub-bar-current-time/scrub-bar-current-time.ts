import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { PERCENTAGE } from '../../constants';

/**
 * Current playback position indicator component for the Eva scrub bar.
 *
 * Renders the current playback position as a CSS percentage string (e.g. `"42%"`),
 * intended to be layered inside `eva-scrub-bar` to show the played portion of the video.
 *
 * Percentage calculation rules:
 * - **No time data** — returns `"0%"` if the time object is not yet available.
 * - **Live stream** — returns `"100%"` when total duration is `Infinity`, keeping the
 *   indicator at the far right as expected for a live stream.
 * - **VOD** — calculates `(current / total) * PERCENTAGE`, rounded to the nearest integer.
 *
 * @example
 * // Used inside eva-scrub-bar template
 * <eva-scrub-bar-current-time />
 */
@Component({
  selector: 'eva-scrub-bar-current-time',
  templateUrl: './scrub-bar-current-time.html',
  styleUrl: './scrub-bar-current-time.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaScrubBarCurrentTime {
  private readonly evaAPI = inject(EvaApi);

  /**
   * The current playback position as a CSS percentage string (e.g. `"42%"`). Bound to the template.
   *
   * - Returns `"0%"` if time data is unavailable.
   * - Returns `"100%"` for live streams (`total === Infinity`).
   * - Otherwise returns `Math.round(current * PERCENTAGE) / total + "%"`.
   */
  protected readonly currentTimePercentage = computed(() => {
    const time = this.evaAPI.time();
    // Check if it's live
    if (time.total === Infinity) {
      return "100%";
    }
    if (!time.total) {
      return "0%";
    }
    return `${Math.round((time.current / time.total) * PERCENTAGE)}%`;
  });
}