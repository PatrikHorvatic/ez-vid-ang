import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaDownloadEvent } from '../../types';
import { transformEvaDownloadAria, EvaDownloadAria, EvaDownloadAriaTransformed } from '../../utils/aria-utilities';

/**
 * Download button component for the Eva video player.
 *
 * Renders as a `role="button"` element with `tabindex="0"`. On click or
 * keyboard activation (`Enter` / `Space`), emits an `evaDownloadClicked`
 * event containing the current video source URL, playback time, and duration.
 *
 * The component does **not** perform any download logic itself — the consumer
 * is responsible for handling the emitted `EvaDownloadEvent` (e.g. triggering
 * a file download, opening a new tab, or calling a backend API).
 *
 * Supports custom icons via content projection when `evaCustomIcon` is `true`.
 *
 * @example
 * // Default icon
 * <eva-download (evaDownloadClicked)="onDownload($event)" />
 *
 * @example
 * // Custom icon
 * <eva-download [evaCustomIcon]="true" (evaDownloadClicked)="onDownload($event)">
 *   <img src="download-icon.svg" alt="" />
 * </eva-download>
 *
 * @example
 * // Custom ARIA label
 * <eva-download
 *   [evaAria]="{ ariaLabel: 'Save video' }"
 *   (evaDownloadClicked)="onDownload($event)"
 * />
 */
@Component({
  selector: 'eva-download',
  templateUrl: './download.html',
  styleUrl: './download.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "evaAria().ariaLabel",
    "(click)": "downloadClicked()",
    "(keydown)": "downloadClickedKeyboard($event)"
  }
})
export class EvaDownload {
  private readonly evaAPI = inject(EvaApi);

  /**
   * When `true`, hides the built-in SVG icon so you can provide
   * your own icon via content projection.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  /**
   * ARIA label for the download button.
   *
   * @default { ariaLabel: "Download" }
   */
  public readonly evaAria = input<EvaDownloadAriaTransformed, EvaDownloadAria>(transformEvaDownloadAria(undefined), { transform: transformEvaDownloadAria });

  /**
   * Emitted when the download button is clicked or activated via keyboard.
   * Contains the current video source URL, playback time, and duration.
   */
  public readonly evaDownloadClicked = output<EvaDownloadEvent>();

  protected downloadClicked(): void {
    this.evaDownloadClicked.emit(this.buildEvent());
  }

  protected downloadClickedKeyboard(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.downloadClicked();
    }
  }

  private buildEvent(): EvaDownloadEvent {
    const video = this.evaAPI.assignedVideoElement;
    return {
      currentSrc: video?.currentSrc ?? '',
      currentTime: video?.currentTime ?? 0,
      duration: this.evaAPI.time().total,
    };
  }
}
