import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';
import { EvaFullscreenAria, EvaFullscreenAriaTransformed, transformEvaFullscreenAria } from '../../utils/aria-utilities';

/**
 * Fullscreen toggle button component for the Eva video player.
 *
 * Renders as a `role="button"` element with `tabindex="0"`, making it focusable
 * and keyboard accessible without a native `<button>` element.
 *
 * The component tracks the current fullscreen state via `EvaFullscreenAPI` and
 * updates its `aria-label` accordingly to reflect whether the player is in
 * fullscreen or windowed mode.
 *
 * When clicked, the component attempts to locate the nearest `eva-player` container
 * and toggles fullscreen on it. Built-in icon can be suppressed with `evaCustomIcon`
 * to use your own.
 *
 * Keyboard support: `Enter` and `Space` toggle fullscreen.
 *
 * @example
 * // Minimal usage
 * <eva-fullscreen />
 *
 * @example
 * // Custom ARIA labels
 * <eva-fullscreen [evaAria]="{ enterFullscreen: 'Go fullscreen', exitFullscreen: 'Exit fullscreen' }" />
 *
 * @example
 * // Custom icon
 * <eva-fullscreen [evaCustomIcon]="true">
 *    <img src="your-image" />
 * </eva-fullscreen>
 */
@Component({
  selector: 'eva-fullscreen',
  templateUrl: './fullscreen.html',
  styleUrl: './fullscreen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "ariaLabel()",
    "[class.eva-icon]": "!evaCustomIcon()",
    "[class.eva-icon-fullscreen]": "!evaCustomIcon()",
    "(click)": "fullscreenClicked()",
    "(keydown)": "fullscreenClickedKeyboard($event)"
  }
})
export class EvaFullscreen implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);
  private fullscreenService = inject(EvaFullscreenAPI);

  /**
   * When `true`, suppresses all built-in icon classes (`eva-icon`, `eva-icon-fullscreen`)
   * so you can provide your own icon.
   *
   * @default false
   */
  readonly evaCustomIcon = input<boolean>(false);

  /**
   * ARIA labels for the enter and exit fullscreen states.
   *
   * All properties are optional — default values are applied via `transformEvaFullscreenAria`:
   * - `enterFullscreen` → `"Enter fullscreen"`
   * - `exitFullscreen` → `"Exit fullscreen"`
   */
  readonly evaAria = input<EvaFullscreenAriaTransformed, EvaFullscreenAria>(transformEvaFullscreenAria(undefined), { transform: transformEvaFullscreenAria });

  /** Reactive signal tracking whether the player is currently in fullscreen mode. */
  protected isFullscreen = signal(false);

  /**
   * Resolves the `aria-label` based on the current fullscreen state.
   * Returns `exitFullscreen` when in fullscreen, `enterFullscreen` otherwise.
   */
  protected ariaLabel = computed(() => {
    return this.isFullscreen() ? this.evaAria().exitFullscreen : this.evaAria().enterFullscreen;
  });

  /** Subscription to fullscreen state changes from `EvaFullscreenAPI`. Cleaned up in `ngOnDestroy`. */
  private fullscreenSubscription: Subscription | null = null;

  /**
   * Subscribes to `EvaFullscreenAPI.isFullscreenObs` to keep `isFullscreen`
   * in sync with the actual fullscreen state of the browser.
   */
  ngOnInit(): void {
    this.fullscreenSubscription = this.fullscreenService.isFullscreenObs.subscribe(
      isFullscreen => {
        this.isFullscreen.set(isFullscreen);
      }
    );
  }

  /** Unsubscribes from the fullscreen state subscription to prevent memory leaks. */
  ngOnDestroy(): void {
    if (this.fullscreenSubscription) {
      this.fullscreenSubscription.unsubscribe();
    }
  }

  /**
   * Handles the fullscreen toggle on click.
   *
   * Locates the nearest `eva-player` container via `findPlayerContainer()`, then
   * delegates the toggle to `EvaFullscreenAPI.toggleFullscreen()` along with the
   * currently assigned video element. Logs a warning if no player container is found
   * and logs an error if the toggle throws.
   */
  protected async fullscreenClicked() {
    try {
      const videoElement = this.evaAPI.assignedVideoElement;
      if (!videoElement) {
        console.warn('Video element not assigned');
        return;
      }
      const playerContainer = videoElement.closest('eva-player') as HTMLElement | null;
      if (!playerContainer) {
        console.warn('Player container not found');
        return;
      }
      await this.fullscreenService.toggleFullscreen(playerContainer, videoElement);
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  }

  /**
   * Handles keyboard events on the host element.
   * Triggers fullscreen toggle on `Enter` or `Space` keypress.
   */
  protected fullscreenClickedKeyboard(k: KeyboardEvent) {
    if (k.key === 'Enter' || k.key === ' ') {
      k.preventDefault();
      this.fullscreenClicked();
    }
  }
}