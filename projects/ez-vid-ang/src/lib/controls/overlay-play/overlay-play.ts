import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaIcon } from '../../core/icon/icon';
import { EvaState } from '../../types';
import { EvaOverlayPlayAria, EvaOverlayPlayAriaTransformed, transformEvaOverlayPlayAria } from '../../utils/aria-utilities';

/**
 * Overlay play button component for the Eva video player.
 *
 * Renders as a focusable element that appears over the video when it is in a
 * non-playing state — specifically when the state is `loading`, `paused`, or `error`.
 * By default the overlay is **not** shown in the `ended` state; set `evaShowPlayOnVideoEnding`
 * to `true` if you want it visible on end (only when not using `<eva-ended-overlay>`).
 * The overlay is hidden during buffering via the `eva-display-overlay-play` class binding.
 *
 * The component tracks the current video state via `EvaApi.videoStateSubject` and shows
 * or hides the play icon accordingly. The default `play` icon is resolved from the Eva
 * icon registry. Register it with `addEvaIcons` before using the component.
 *
 * Use `evaCustomIcon` to suppress the registry icon and project your own content instead.
 *
 * Keyboard support: `Enter` and `Space` trigger play/pause.
 *
 * @example
 * // Register icons once (e.g. in main.ts or app config)
 * import { addEvaIcons } from 'ez-vid-ang';
 * import { evaPlayIcon } from 'ez-vid-ang/icons';
 * addEvaIcons({ evaPlayIcon });
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
  imports: [EvaIcon],
  templateUrl: './overlay-play.html',
  styleUrl: './overlay-play.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "ariaLabel()",
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
   * When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead,
   * allowing you to project a custom overlay play icon.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);


  /**
   * When `true`, the overlay play button remains visible when the video reaches the `ENDED` state.
   *
   * Set to `false` (the default) when using `<eva-ended-overlay>` — the two components
   * are mutually exclusive and should not be visible at the same time. Set to `true` only
   * when you want the standard play icon to act as the replay affordance with no ended overlay.
   *
   * @default false
   */
  public readonly evaShowPlayOnVideoEnding = input<boolean>(false);

  /** Resolves the `aria-label` from the transformed aria input. */
  protected readonly ariaLabel = computed<string>(() => this.evaOvelayPlayAria().ariaLabel);

  /**
   * `true` when the play icon should be visible — that is, when the current video state is
   * `loading`, `paused`, or `error`, or `ended` with `evaShowPlayOnVideoEnding` enabled.
   * Also controls the `eva-display-overlay-play` host class (gated on `!evaAPI.isBuffering()`).
   */
  protected readonly evaIconPlay = computed<boolean>(() =>
    this.playingState() === EvaState.LOADING ||
    this.playingState() === EvaState.PAUSED ||
    (this.playingState() === EvaState.ENDED && this.evaShowPlayOnVideoEnding()) ||
    this.playingState() === EvaState.ERROR
  );

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

