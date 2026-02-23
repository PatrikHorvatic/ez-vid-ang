import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaTimeFormating, EvaTimeProperty } from '../../types';
import { EvaTimeDisplayAria, EvaTimeDisplayAriaTransformed, transformEvaTimeDisplayAria } from '../../utils/aria-utilities';
import { EvaTimeDisplayPipe } from "../pipes/time-display-pipe";

/**
 * Time display component for the Eva video player.
 *
 * Renders a single time value — current, total, or remaining — formatted according
 * to the specified time format. Exposes the value to screen readers via `aria-valuetext`
 * and identifies itself as a `role="timer"` element.
 *
 * For live streams, the display text is replaced with the value of `evaLiveText`
 * regardless of the `evaTimeProperty` setting.
 *
 * ARIA notes:
 * - `aria-live` is set to `"off"` by default to prevent screen readers from announcing
 *   every time update. Change to `"polite"` if live announcements are desired.
 * - `aria-atomic="true"` ensures the full value is read as a single unit when announced.
 * - `aria-label` is resolved from `evaAria` based on the active `evaTimeProperty`.
 *
 * @example
 * // Display current time in mm:ss format
 * <eva-time-display evaTimeProperty="current" evaTimeFormating="mm:ss" />
 *
 * @example
 * // Display total duration in HH:mm:ss format
 * <eva-time-display evaTimeProperty="total" evaTimeFormating="HH:mm:ss" />
 *
 * @example
 * // Display remaining time with a custom live label and custom ARIA label
 * <eva-time-display
 *   evaTimeProperty="remaining"
 *   evaTimeFormating="mm:ss"
 *   evaLiveText="● LIVE"
 *   [evaAria]="{ ariaLabelRemaining: 'Time remaining' }"
 * />
 */
@Component({
  selector: 'eva-time-display',
  templateUrl: './time-display.html',
  styleUrl: './time-display.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "timer",
    "[attr.aria-label]": "ariaLabel()",
    "[attr.aria-live]": "'off'", // Change to 'polite' for live updates announcements
    "[attr.aria-atomic]": "'true'",
    "[attr.aria-valuetext]": "displayText()",
  },
  imports: [EvaTimeDisplayPipe]
})
export class EvaTimeDisplay {
  protected evaAPI = inject(EvaApi);

  /**
   * Which time value to display.
   *
   * **Required.** Accepted values from `EvaTimeProperty`:
   * - `"current"` — elapsed playback time
   * - `"total"` — total video duration
   * - `"remaining"` — time left until the end
   *
   * Also determines which `evaAria` label property is applied to `aria-label`.
   */
  readonly evaTimeProperty = input.required<EvaTimeProperty>();

  /**
   * The format used to render the time value.
   *
   * **Required.** Accepted values from `EvaTimeFormating`:
   * - `'HH:mm:ss'` — e.g. `"01:23:45"`
   * - `'mm:ss'` — e.g. `"23:45"`
   * - default fallback — `"m:ss"`
   */
  readonly evaTimeFormating = input.required<EvaTimeFormating>();

  /**
   * Text displayed in place of the time value when the stream is live.
   *
   * @default "LIVE"
   */
  readonly evaLiveText = input<string>("LIVE");

  /**
   * ARIA labels for the timer element, keyed by `evaTimeProperty`.
   *
   * All properties are optional — default values are applied via `transformEvaTimeDisplayAria`:
   * - `ariaLabelCurrent` — label used when `evaTimeProperty` is `"current"`
   * - `ariaLabelTotal` — label used when `evaTimeProperty` is `"total"`
   * - `ariaLabelRemaining` — label used when `evaTimeProperty` is `"remaining"`
   */
  readonly evaAria = input<EvaTimeDisplayAriaTransformed, EvaTimeDisplayAria>(transformEvaTimeDisplayAria(undefined), { transform: transformEvaTimeDisplayAria });

  /**
   * Resolves the `aria-label` based on the active `evaTimeProperty`:
   * - `"current"` → `evaAria().ariaLabelCurrent`
   * - `"total"` → `evaAria().ariaLabelTotal`
   * - `"remaining"` → `evaAria().ariaLabelRemaining`
   */
  protected ariaLabel = computed(() => {
    const property = this.evaTimeProperty();
    if (property === "current") {
      return this.evaAria().ariaLabelCurrent;
    }
    else if (property === "total") {
      return this.evaAria().ariaLabelTotal;
    }
    else {
      return this.evaAria().ariaLabelRemaining;
    }
  });

  /**
   * Resolves the formatted time string to render and expose via `aria-valuetext`.
   *
   * - For live streams, returns `evaLiveText` regardless of `evaTimeProperty`.
   * - Otherwise reads the appropriate time value from `EvaApi.time()` and formats
   *   it via `formatTime()` using the active `evaTimeFormating`.
   */
  protected displayText = computed(() => {
    if (this.evaAPI.isLive()) {
      return this.evaLiveText();
    }

    // You'll need to implement the formatting logic here
    // or import a utility function from your pipe
    const timeValue = this.evaAPI.time()[this.evaTimeProperty()];
    return this.formatTime(timeValue, this.evaTimeFormating());
  });

  /**
   * Formats a time value in seconds into a display string according to the given format.
   *
   * This method mirrors the logic of `EvaTimeDisplayPipe` and should be kept in sync with it.
   *
   * Format outputs:
   * - `'HH:mm:ss'` → `"01:23:45"`
   * - `'mm:ss'` → `"23:45"`
   * - default → `"m:ss"` (minutes unpadded, seconds zero-padded)
   *
   * @param seconds - The time value in seconds to format.
   * @param format - The target format from `EvaTimeFormating`.
   */
  private formatTime(seconds: number, format: EvaTimeFormating): string {
    // Implement your time formatting logic here
    // This should match what your EvaTimeDisplayPipe does
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    switch (format) {
      case 'HH:mm:ss':
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      case 'mm:ss':
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      // Add other formats as needed
      default:
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
}