import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaState } from '../../types';
import { EvaPlayPauseAria, EvaPlayPauseAriaTransformed, transformEvaPlayPauseAria } from '../../utils/aria-utilities';

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
 * Icon states:
 * - `eva-icon-pause` — shown when state is `playing`
 * - `eva-icon-play_arrow` — shown when state is `loading`, `paused`, `ended`, or `error`
 *
 * Built-in icons can be suppressed with `evaCustomIcon` to use your own.
 *
 * Keyboard support: `Enter` and `Space` trigger play/pause.
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
 * <eva-play-pause [evaCustomIcon]="true" />
 */
@Component({
  selector: 'eva-play-pause',
  templateUrl: './play-pause.html',
  styleUrl: './play-pause.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "ariaLabel()",
    "[attr.aria-valuetext]": "ariaValueText()",
    "[class.eva-icon]": "!evaCustomIcon()",
    "[class.eva-icon-pause]": "!evaCustomIcon() && evaIconPause()",
    "[class.eva-icon-play_arrow]": "!evaCustomIcon() && evaIconPlay()",
    "(click)": "playPauseClicked()",
    "(keydown)": "playPauseClickedKeyboard($event)"
  }
})
export class EvaPlayPause implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);

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
  readonly evaPlayPauseAria = input<EvaPlayPauseAriaTransformed, EvaPlayPauseAria>(
    transformEvaPlayPauseAria(undefined),
    { transform: transformEvaPlayPauseAria }
  );

  /**
   * When `true`, suppresses all built-in icon classes (`eva-icon`, `eva-icon-pause`, `eva-icon-play_arrow`)
   * so you can provide your own icon.
   *
   * @default false
   */
  readonly evaCustomIcon = input<boolean>(false);

  /**
   * Resolves the `aria-label` based on the current playback state.
   * Returns `ariaLabel.pause` when playing, `ariaLabel.play` otherwise.
   */
  protected ariaLabel = computed<string>(() => {
    return this.playingState() === 'playing' ? this.evaPlayPauseAria().ariaLabel.play : this.evaPlayPauseAria().ariaLabel.pause;
  });

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
  protected ariaValueText = computed<string>(() => {
    if (this.playingState() === "loading") {
      return this.evaPlayPauseAria().ariaValueText.loading;
    }
    else if (this.playingState() === "playing") {
      return this.evaPlayPauseAria().ariaValueText.playing;
    }
    else if (this.playingState() === "paused") {
      return this.evaPlayPauseAria().ariaValueText.paused;
    }
    else if (this.playingState() === "ended") {
      return this.evaPlayPauseAria().ariaValueText.ended;
    }
    else if (this.playingState() === "error") {
      return this.evaPlayPauseAria().ariaValueText.errored;
    }
    else {
      return "loading";
    }
  });

  /** `true` when the video is playing. Applies `eva-icon-pause` to the host element. */
  protected evaIconPause = computed<boolean>(() => {
    return this.playingState() === 'playing';
  });

  /**
   * `true` when the video is in a non-playing state (`loading`, `paused`, `ended`, or `error`).
   * Applies `eva-icon-play_arrow` to the host element.
   */
  protected evaIconPlay = computed<boolean>(() => {
    return this.playingState() === 'loading' || this.playingState() === 'paused' || this.playingState() === 'ended' || this.playingState() === 'error';
  });

  /** Reactive signal tracking the current video playback state. Initialized from `EvaApi`. */
  protected playingState: WritableSignal<EvaState> = signal(this.evaAPI.getCurrentVideoState());

  /** Subscription to video state changes from `EvaApi`. Cleaned up in `ngOnDestroy`. */
  private playingStateSub: Subscription | null = null;

  /**
   * Subscribes to `EvaApi.videoStateSubject` to keep `playingState`
   * in sync with the current video playback state.
   */
  ngOnInit(): void {
    this.playingStateSub = this.evaAPI.videoStateSubject.subscribe(state => {
      this.playingState.set(state);
    })
  }

  /** Unsubscribes from the video state subscription to prevent memory leaks. */
  ngOnDestroy(): void {
    this.playingStateSub?.unsubscribe();
  }

  /** Delegates play/pause toggling to `EvaApi`. */
  protected playPauseClicked() {
    this.evaAPI.playOrPauseVideo();
  }

  /**
   * Handles keyboard events on the host element.
   * Triggers play/pause on `Enter` (13) or `Space` (32) keypress.
   */
  protected playPauseClickedKeyboard(k: KeyboardEvent) {
    // On press Enter (13) or Space (32)
    if (k.keyCode === 13 || k.keyCode === 32) {
      k.preventDefault();
      this.playPauseClicked();
    }
  }
}