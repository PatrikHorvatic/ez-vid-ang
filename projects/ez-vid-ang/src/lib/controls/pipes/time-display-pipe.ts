import { Pipe, PipeTransform } from '@angular/core';
import { EvaTimeFormating, EvaTimeProperty } from '../../types';

/**
 * Pure pipe that formats a time value in seconds into a display string
 * for use in Eva video player time displays.
 *
 * The pipe is **pure** — it only re-evaluates when its input references change.
 *
 * Rounding behaviour:
 * - For `"remaining"` time, seconds are **ceiling-rounded** (`Math.ceil`) so the
 *   remaining time never prematurely shows zero before the video actually ends.
 * - For all other properties, seconds are **floor-rounded** (`Math.floor`).
 * - Negative values are clamped to `0`.
 *
 * Format outputs:
 * - `'HH:mm:ss'` — zero-padded hours, minutes, seconds (e.g. `"01:23:45"`)
 * - `'mm:ss'` — total minutes (including overflow from hours) and seconds (e.g. `"83:45"`)
 * - `'ss'` — total seconds as a plain integer string (e.g. `"5025"`)
 * - default fallback — `"00:00"`
 *
 * @example
 * // In a template
 * {{ time.current | evaTimeDisplay:'mm:ss':'current' }}
 * {{ time.remaining | evaTimeDisplay:'HH:mm:ss':'remaining' }}
 */
@Pipe({
  name: 'evaTimeDisplay',
  pure: true
})
export class EvaTimeDisplayPipe implements PipeTransform {

  /**
   * Formats a time value in seconds into a display string.
   *
   * @param value - The time value in seconds to format.
   * @param formating - The target display format (`'HH:mm:ss'`, `'mm:ss'`, or `'ss'`).
   * @param timeProperty - The time property being displayed (`'current'`, `'total'`, or `'remaining'`).
   *   Affects rounding: `'remaining'` uses `Math.ceil`, all others use `Math.floor`.
   * @returns A formatted time string, or `"00:00"` if the format is unrecognised.
   */
  transform(value: number, formating: EvaTimeFormating, timeProperty: EvaTimeProperty): string {
    let totalSeconds: number = timeProperty === "remaining" ? Math.max(0, Math.ceil(value)) : Math.max(0, Math.floor(value));

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    switch (formating) {
      case "HH:mm:ss":
        return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;

      case "mm:ss":
        // Include hours in total minutes if present
        const totalMinutes = hours * 60 + minutes;
        return `${this.pad(totalMinutes)}:${this.pad(seconds)}`;

      case "ss":
        return `${totalSeconds}`;

      default:
        return "00:00";
    }
  }

  /**
   * Zero-pads a number to at least 2 digits.
   *
   * @param num - The number to pad.
   * @returns A string of at least 2 characters (e.g. `7` → `"07"`, `123` → `"123"`).
   */
  private pad(num: number): string {
    return num.toString().padStart(2, '0');
  }
}