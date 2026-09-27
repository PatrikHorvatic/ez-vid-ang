import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { EvaApi } from "../../api/eva-api";
import { EvaTimeFormating, EvaTimeProperty } from "../../types";
import { transformEvaTimeDisplayAria, EvaTimeDisplayAria, EvaTimeDisplayAriaTransformed } from "../../utils/aria-utilities";
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
  selector: "eva-time-display",
  imports: [EvaTimeDisplayPipe],
  templateUrl: "./time-display.html",
  styleUrl: "./time-display.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    tabindex: "0",
    role: "timer",
    "[attr.aria-label]": "ariaLabel()",
    "[attr.aria-live]": "'off'",
    "[attr.aria-atomic]": "'true'",
    "[attr.aria-valuetext]": "displayText()",
  },
})
export class EvaTimeDisplay {
  protected evaAPI = inject(EvaApi);

  /** Shared formatting logic with the template's `evaTimeDisplay` pipe usage, so `aria-valuetext` and the visible text never drift apart. */
  private readonly timeDisplayPipe = new EvaTimeDisplayPipe();

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
  public readonly evaTimeProperty = input.required<EvaTimeProperty>();

  /**
   * The format used to render the time value.
   *
   * **Required.** Accepted values from `EvaTimeFormating`:
   * - `'HH:mm:ss'` — e.g. `"01:23:45"`
   * - `'mm:ss'` — e.g. `"23:45"`
   * - default fallback — `"m:ss"`
   */
  public readonly evaTimeFormating = input.required<EvaTimeFormating>();

  /**
   * Text displayed in place of the time value when the stream is live.
   *
   * @default "LIVE"
   */
  public readonly evaLiveText = input<string>("LIVE");

  /**
   * ARIA labels for the timer element, keyed by `evaTimeProperty`.
   *
   * All properties are optional — default values are applied via `transformEvaTimeDisplayAria`:
   * - `ariaLabelCurrent` — label used when `evaTimeProperty` is `"current"`
   * - `ariaLabelTotal` — label used when `evaTimeProperty` is `"total"`
   * - `ariaLabelRemaining` — label used when `evaTimeProperty` is `"remaining"`
   */
  public readonly evaAria = input<EvaTimeDisplayAriaTransformed, EvaTimeDisplayAria>(transformEvaTimeDisplayAria(undefined), { transform: transformEvaTimeDisplayAria });

  /**
   * Resolves the `aria-label` based on the active `evaTimeProperty`:
   * - `"current"` → `evaAria().ariaLabelCurrent`
   * - `"total"` → `evaAria().ariaLabelTotal`
   * - `"remaining"` → `evaAria().ariaLabelRemaining`
   */
  protected readonly ariaLabel = computed(() => {
    const property = this.evaTimeProperty();
    if (property === "current") {
      return this.evaAria().ariaLabelCurrent;
    } else if (property === "total") {
      return this.evaAria().ariaLabelTotal;
    }

    return this.evaAria().ariaLabelRemaining;
  });

  /**
   * Resolves the formatted time string to render and expose via `aria-valuetext`.
   *
   * - For live streams, returns `evaLiveText` regardless of `evaTimeProperty`.
   * - Otherwise reads the appropriate time value from `EvaApi.time()` and formats
   *   it via `formatTime()` using the active `evaTimeFormating`.
   */
  protected readonly displayText = computed(() => {
    if (this.evaAPI.isLive()) {
      return this.evaLiveText();
    }

    const timeProperty = this.evaTimeProperty();
    const timeValue = this.evaAPI.time()[timeProperty];
    return this.timeDisplayPipe.transform(timeValue, this.evaTimeFormating(), timeProperty);
  });
}
