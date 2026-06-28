import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaScreenshotEvent } from '../../types';
import { transformEvaScreenshotAria, EvaScreenshotAria, EvaScreenshotAriaTransformed } from '../../utils/aria-utilities';
import { DEFAULT_IMAGE_QUALITY } from '../../constants';

/**
 * Screenshot button component for the Eva video player.
 *
 * Renders as a `role="button"` element with `tabindex="0"`. On click or
 * keyboard activation (`Enter` / `Space`), delegates to
 * `EvaApi.captureScreenshot()` and emits the result.
 *
 * The consumer handles the captured data (download, copy to clipboard,
 * upload, etc.).
 *
 * Supports custom icons via content projection when `evaCustomIcon` is `true`.
 *
 * @example
 * // Default icon
 * <eva-screenshot (evaScreenshotCaptured)="onScreenshot($event)" />
 *
 * @example
 * // Custom icon
 * <eva-screenshot [evaCustomIcon]="true" (evaScreenshotCaptured)="onScreenshot($event)">
 *   <img src="camera-icon.svg" alt="" />
 * </eva-screenshot>
 *
 * @example
 * // JPEG format
 * <eva-screenshot evaImageFormat="image/jpeg" [evaImageQuality]="0.8"
 *   (evaScreenshotCaptured)="onScreenshot($event)" />
 */
@Component({
  selector: 'eva-screenshot',
  templateUrl: './screenshot.html',
  styleUrl: './screenshot.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "evaAria().ariaLabel",
    "(click)": "captureClicked()",
    "(keydown)": "captureClickedKeyboard($event)"
  }
})
export class EvaScreenshot {
  private readonly evaAPI = inject(EvaApi);

  /**
   * When `true`, hides the built-in SVG icon so you can provide
   * your own icon via content projection.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  /**
   * Image format for the captured screenshot.
   * Accepts any MIME type supported by `HTMLCanvasElement.toDataURL()` / `toBlob()`.
   *
   * @default "image/png"
   */
  public readonly evaImageFormat = input<string>('image/png');

  /**
   * Image quality for lossy formats (`image/jpeg`, `image/webp`).
   * A number between `0` and `1`. Ignored for `image/png`.
   *
   * @default 0.92
   */
  public readonly evaImageQuality = input<number>(DEFAULT_IMAGE_QUALITY);

  /**
   * ARIA label for the screenshot button.
   *
   * @default { ariaLabel: "Screenshot" }
   */
  public readonly evaAria = input<EvaScreenshotAriaTransformed, EvaScreenshotAria>(transformEvaScreenshotAria(undefined), { transform: transformEvaScreenshotAria });

  /**
   * Emitted when a screenshot is captured or capture fails.
   * Contains the `Blob`, data URL, timestamp, and dimensions.
   * `blob` and `dataUrl` are `null` if the canvas is tainted (cross-origin).
   * Not emitted if the player is not ready or the video has no rendered frames.
   */
  public readonly evaScreenshotCaptured = output<EvaScreenshotEvent>();

  protected captureClicked(): void {
    this.capture();
  }

  protected captureClickedKeyboard(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.capture();
    }
  }

  private async capture(): Promise<void> {
    const result = await this.evaAPI.captureScreenshot(this.evaImageFormat(), this.evaImageQuality());
    if (result) {
      this.evaScreenshotCaptured.emit(result);
    }
  }
}
