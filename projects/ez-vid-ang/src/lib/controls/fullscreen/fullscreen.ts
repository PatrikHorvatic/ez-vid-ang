import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
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
  standalone: false,
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
  protected isFullscreen: WritableSignal<boolean> = signal(false);

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
      // Get the player container element
      const playerContainer = this.findPlayerContainer();

      if (!playerContainer) {
        console.warn('Player container not found');
        return;
      }

      // Get the video element if available
      const videoElement = this.evaAPI.assignedVideoElement;

      // Toggle fullscreen
      await this.fullscreenService.toggleFullscreen(playerContainer, videoElement);
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  }

  /**
   * Handles keyboard events on the host element.
   * Triggers fullscreen toggle on `Enter` (13) or `Space` (32) keypress.
   */
  protected fullscreenClickedKeyboard(k: KeyboardEvent) {
    // On press Enter (13) or Space (32)
    if (k.keyCode === 13 || k.keyCode === 32) {
      k.preventDefault();
      this.fullscreenClicked();
    }
  }

  /**
   * Attempts to locate the `eva-player` container element in the DOM.
   *
   * First queries for `eva-player` globally. If not found, falls back to
   * traversing up from the current `eva-fullscreen` element using `closest()`.
   *
   * @returns The player `HTMLElement` if found, otherwise `null`.
   */
  private findPlayerContainer(): HTMLElement | null {
    // Try to find eva-player as parent
    const playerElement = document.querySelector('eva-player') as HTMLElement;

    if (playerElement) {
      return playerElement;
    }

    // Fallback: try to find from current element
    const currentElement = document.querySelector('eva-fullscreen');
    if (currentElement) {
      const closestPlayer = currentElement.closest('eva-player') as HTMLElement;
      if (closestPlayer) {
        return closestPlayer;
      }
    }

    return null;
  }
}