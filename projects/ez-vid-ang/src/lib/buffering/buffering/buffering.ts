import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { EvaApi } from '../../api/eva-api';

/**
 * Buffering indicator component for the Eva video player.
 *
 * Displays a buffering/loading spinner when the video is in a buffering state.
 * Visibility is controlled entirely via the `eva-display-buffering` host class,
 * which is applied whenever `EvaApi.isBuffering()` returns `true`.
 *
 * By default, a built-in spinner is rendered. It can be suppressed via `defaultSpinner`
 * to allow a custom spinner to be projected in its place via content projection.
 *
 * @example
 * // Default built-in spinner
 * <eva-buffering />
 *
 * @example
 * // Custom spinner via content projection
 * <eva-buffering [defaultSpinner]="false">
 *   <my-custom-spinner />
 * </eva-buffering>
 */
@Component({
  selector: 'eva-buffering',
  templateUrl: './buffering.html',
  styleUrl: './buffering.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class.eva-display-buffering]": "evaAPI.isBuffering()"
  }
})
export class EvaBuffering {
  protected evaAPI = inject(EvaApi);

  /**
   * When `true`, renders the built-in default spinner.
   * Set to `false` to suppress it and provide your own via content projection.
   *
   * @default true
   */
  readonly defaultSpinner = input<boolean>(true);
}