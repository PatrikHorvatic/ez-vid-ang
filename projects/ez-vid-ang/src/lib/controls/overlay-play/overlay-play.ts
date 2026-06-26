import { ChangeDetectionStrategy, Component, computed, inject, input, signal, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { transformEvaOverlayPlayAria, EvaOverlayPlayAria, EvaOverlayPlayAriaTransformed } from '../../utils/aria-utilities';
import { EvaState } from '../../types';

/**
 * Overlay play button component for the Eva video player.
 *
 * Renders as a focusable element that appears over the video when it is in a
 * non-playing state — specifically when the state is `loading`, `paused`, `ended`,
 * or `error`. The overlay is hidden during buffering via the `eva-display-overlay-play`
 * class binding.
 *
 * The component tracks the current video state via `EvaApi.videoStateSubject` and shows
 * or hides the play icon accordingly. The built-in icon can be suppressed with
 * `evaCustomIcon` to use your own.
 *
 * Keyboard support: `Enter` and `Space` trigger play/pause.
 *
 * @example
 * // Minimal usage
 * <eva-overlay-play />
 *
 * @example
 * // Custom ARIA label
 * <eva-overlay-play [evaOvelayPlayAria]="{ ariaLabel: 'Play video' }" />
 *
 * @example
 * // Custom icon
 * <eva-overlay-play [evaCustomIcon]="true">
 *   <p>Custom content</p>
 * </eva-overlay-play>
 */
@Component({
  selector: 'eva-overlay-play',
  templateUrl: './overlay-play.html',
  styleUrl: './overlay-play.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "ariaLabel()",
    "[class.eva-icon]": "!evaCustomIcon()",
    "[class.eva-icon-play_arrow]": "!evaCustomIcon() && evaIconPlay()",
    "[class.eva-display-overlay-play]": "evaIconPlay() && !evaAPI.isBuffering()",
    "(click)": "playClicked()"
  }
})
export class EvaOverlayPlay implements OnInit, OnDestroy {
  protected evaAPI = inject(EvaApi);

  /**
   * ARIA label for the overlay play button.
   *
   * All properties are optional — default values are applied via `transformEvaOverlayPlayAria`.
   */
  public readonly evaOvelayPlayAria = input<EvaOverlayPlayAriaTransformed, EvaOverlayPlayAria>(transformEvaOverlayPlayAria(undefined), { transform: transformEvaOverlayPlayAria });

  /**
   * When `true`, suppresses all built-in icon classes (`eva-icon`, `eva-icon-play_arrow`)
   * so you can provide your own icon.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  /** Resolves the `aria-label` from the transformed aria input. */
  protected readonly ariaLabel = computed<string>(() => this.evaOvelayPlayAria().ariaLabel);

  /**
   * `true` when the play icon should be visible — that is, when the current video
   * state is one of `loading`, `paused`, `ended`, or `error`.
   * Applies `eva-icon-play_arrow` and `eva-display-overlay-play` to the host element,
   * with the latter additionally gated on `!evaAPI.isBuffering()`.
   */
  protected readonly evaIconPlay = computed<boolean>(() => this.playingState() === EvaState.LOADING || this.playingState() === EvaState.PAUSED || this.playingState() === EvaState.ENDED || this.playingState() === EvaState.ERROR);

  /** Reactive signal tracking the current video playback state. Initialized from `EvaApi`. */
  protected readonly playingState = signal(this.evaAPI.getCurrentVideoState());

  /** Subscription to video state changes from `EvaApi`. Cleaned up in `ngOnDestroy`. */
  private playingStateSub: Subscription | null = null;

  /**
   * Subscribes to `EvaApi.videoStateSubject` to keep `playingState`
   * in sync with the current video playback state.
   */
  public ngOnInit(): void {
    this.playingStateSub = this.evaAPI.videoStateSubject.subscribe(state => {
      this.playingState.set(state);
    });
  }

  /** Unsubscribes from the video state subscription to prevent memory leaks. */
  public ngOnDestroy(): void {
    this.playingStateSub?.unsubscribe();
  }

  /** Delegates play/pause toggling to `EvaApi`. */
  protected playClicked(): void {
    this.evaAPI.playOrPauseVideo();
  }

}

