import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaDownloadEvent } from '../../types';
import { transformEvaDownloadAria, EvaDownloadAria, EvaDownloadAriaTransformed } from '../../utils/aria-utilities';
import { EvaIcon } from '../../core/icon/icon';

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
 * The default `download` icon is resolved from the Eva icon registry.
 * Register it with `addEvaIcons` before using the component. Use `evaCustomIcon`
 * to suppress the registry icon and project your own content instead.
 *
 * @example
 * // Register icon once (e.g. in main.ts or app config)
 * import { addEvaIcons } from 'ez-vid-ang';
 * import { evaDownloadIcon } from 'ez-vid-ang/icons';
 * addEvaIcons({ evaDownloadIcon });
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
  imports: [EvaIcon],
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
   * When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead,
   * allowing you to project a custom download icon.
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
