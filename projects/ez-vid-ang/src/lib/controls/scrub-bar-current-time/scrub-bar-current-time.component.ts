import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EvaApi } from '../../api/eva-api';

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
 * - **VOD** — calculates `(current / total) * 100`, rounded to the nearest integer.
 *
 * @example
 * // Used inside eva-scrub-bar template
 * <eva-scrub-bar-current-time />
 */
@Component({
  selector: 'eva-scrub-bar-current-time',
  templateUrl: './scrub-bar-current-time.component.html',
  styleUrl: './scrub-bar-current-time.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaScrubBarCurrentTime {
  private evaAPI = inject(EvaApi);

  /**
   * The current playback position as a CSS percentage string (e.g. `"42%"`). Bound to the template.
   *
   * - Returns `"0%"` if time data is unavailable.
   * - Returns `"100%"` for live streams (`total === Infinity`).
   * - Otherwise returns `Math.round(current * 100) / total + "%"`.
   */
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