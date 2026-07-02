import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaState } from '../../types';
import { transformEvaPlayPauseAria, EvaPlayPauseAria, EvaPlayPauseAriaTransformed } from '../../utils/aria-utilities';
import { EvaIcon } from '../../core/icon/icon';

/**
 * Play/pause button component for the Eva video player.
 *
 * Renders as a `role="button"` element with `tabindex="0"`, making it focusable
 * and keyboard accessible without a native `<button>` element.
 *
 * The component tracks the current video state via `EvaApi` and switches between
 * the play and pause icons accordingly. Both `aria-label` and `aria-valuetext` are
 * updated to reflect the current state for screen reader support.
 *
 * Default icons are resolved from the Eva icon registry at render time:
 * - `pause` — shown when state is `playing`
 * - `play` — shown when state is `loading`, `paused`, `ended`, or `error`
 *
 * Register icons with `addEvaIcons` before using the component. Use `evaCustomIcon`
 * to suppress the registry icon and project your own content instead.
 *
 * Keyboard support: `Enter` and `Space` trigger play/pause.
 *
 * @example
 * // Register icons once (e.g. in main.ts or app config)
 * import { addEvaIcons, evaPlayIcon, evaPauseIcon } from 'ez-vid-ang/icons';
 * addEvaIcons({ evaPlayIcon, evaPauseIcon });
 *
 * @example
 * // Minimal usage
 * <eva-play-pause />
 *
 * @example
 * // Custom ARIA labels
 * <eva-play-pause [evaPlayPauseAria]="{ ariaLabel: { play: 'Play', pause: 'Pause' }, ariaValueText: { playing: 'Playing', paused: 'Paused', loading: 'Loading', ended: 'Ended', errored: 'Error' } }" />
 *
 * @example
 * // Custom icon
 * <eva-play-pause [evaCustomIcon]="true">
 *   <img evaPlay src="path-to-your-play-icon" />
 *   <img evaPause src="path-to-your-pause-icon" />
 * </eva-play-pause>
 */
@Component({
  selector: 'eva-play-pause',
  imports: [EvaIcon],
  templateUrl: './play-pause.html',
  styleUrl: './play-pause.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "ariaLabel()",
    "[attr.aria-valuetext]": "ariaValueText()",
    "(click)": "playPauseClicked()",
    "(keydown)": "playPauseClickedKeyboard($event)"
  }
})
export class EvaPlayPause implements OnInit, OnDestroy {
  private readonly evaAPI = inject(EvaApi);

  /**
   * ARIA labels and value texts for the button.
   *
   * All properties are optional — default values are applied via `transformEvaPlayPauseAria`:
   * - `ariaLabel.play` → `"play"`
   * - `ariaLabel.pause` → `"pause"`
   * - `ariaValueText.playing` → `"playing"`
   * - `ariaValueText.paused` → `"paused"`
   * - `ariaValueText.loading` → `"loading"`
   * - `ariaValueText.ended` → `"ended"`
   * - `ariaValueText.errored` → `"errored"`
   *
   * @todo Improve type inference to avoid the need for explicit transform function handling.
   */
  public readonly evaPlayPauseAria = input<EvaPlayPauseAriaTransformed, EvaPlayPauseAria>(
    transformEvaPlayPauseAria(undefined),
    { transform: transformEvaPlayPauseAria }
  );

  /**
   * When `true`, suppresses the registry-sourced icons and renders `<ng-content>` instead,
   * allowing you to project a custom play/pause icon pair using the `evaPlay` and `evaPause`
   * content selectors.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  public readonly playingStateChanged = output<EvaState>();

  /**
   * Resolves the `aria-label` based on the current playback state.
   * Returns `ariaLabel.pause` when playing, `ariaLabel.play` otherwise.
   */
  protected readonly ariaLabel = computed<string>(() => this.playingState() === EvaState.PLAYING ? this.evaPlayPauseAria().ariaLabel.pause : this.evaPlayPauseAria().ariaLabel.play);

  /**
   * Resolves the `aria-valuetext` based on the current playback state.
   * Maps each `EvaState` to its corresponding aria value text:
   * - `loading` → `ariaValueText.loading`
   * - `playing` → `ariaValueText.playing`
   * - `paused` → `ariaValueText.paused`
   * - `ended` → `ariaValueText.ended`
   * - `error` → `ariaValueText.errored`
   * - unknown → `"loading"` (fallback)
   */
  protected readonly ariaValueText = computed<string>(() => {
    if (this.playingState() === EvaState.LOADING) {
      return this.evaPlayPauseAria().ariaValueText.loading;
    }
    else if (this.playingState() === EvaState.PLAYING) {
      return this.evaPlayPauseAria().ariaValueText.playing;
    }
    else if (this.playingState() === EvaState.PAUSED) {
      return this.evaPlayPauseAria().ariaValueText.paused;
    }
    else if (this.playingState() === EvaState.ENDED) {
      return this.evaPlayPauseAria().ariaValueText.ended;
    }
    else if (this.playingState() === EvaState.ERROR) {
      return this.evaPlayPauseAria().ariaValueText.errored;
    }

    return "loading";

  });

  /** `true` when the video is playing — selects the `pause` icon from the registry. */
  protected readonly evaIconPause = computed<boolean>(() => this.playingState() === EvaState.PLAYING);

  /** `true` when the video is in a non-playing state — selects the `play` icon from the registry. */
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
      this.playingStateChanged.emit(state);
    })
  }

  /** Unsubscribes from the video state subscription to prevent memory leaks. */
  public ngOnDestroy(): void {
    this.playingStateSub?.unsubscribe();
  }

  /** Delegates play/pause toggling to `EvaApi`. */
  protected playPauseClicked(): void {
    this.evaAPI.playOrPauseVideo();
  }

  /**
   * Handles keyboard events on the host element.
   * Triggers play/pause on `Enter` or `Space` keypress.
   */
  protected playPauseClickedKeyboard(k: KeyboardEvent): void {
    if (k.key === 'Enter' || k.key === ' ') {
      k.preventDefault();
      this.playPauseClicked();
    }
  }
}