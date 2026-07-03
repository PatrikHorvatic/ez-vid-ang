import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaFullscreenAPI } from '../../api/fullscreen';
import { EvaIcon } from '../../core/icon/icon';
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
 * Default icons are resolved from the Eva icon registry based on fullscreen state:
 * - `fullscreen` — shown when not in fullscreen
 * - `fullscreen-exit` — shown when in fullscreen
 *
 * Register icons with `addEvaIcons` before using the component. Use `evaCustomIcon`
 * to suppress the registry icon and project your own content instead.
 *
 * Keyboard support: `Enter` and `Space` toggle fullscreen.
 *
 * @example
 * // Register icons once (e.g. in main.ts or app config)
 * import { addEvaIcons } from 'ez-vid-ang';
 * import { evaFullscreenIcon, evaFullscreenExitIcon } from 'ez-vid-ang/icons';
 * addEvaIcons({ evaFullscreenIcon, evaFullscreenExitIcon });
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
 *   <img src="your-image" />
 * </eva-fullscreen>
 */
@Component({
  selector: 'eva-fullscreen',
  imports: [EvaIcon],
  templateUrl: './fullscreen.html',
  styleUrl: './fullscreen.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "ariaLabel()",
    "(click)": "fullscreenClicked()",
    "(keydown)": "fullscreenClickedKeyboard($event)"
  }
})
export class EvaFullscreen implements OnInit, OnDestroy {
  private readonly fullscreenService = inject(EvaFullscreenAPI);

  /**
   * When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead,
   * allowing you to project a custom fullscreen/exit icon.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  /**
   * ARIA labels for the enter and exit fullscreen states.
   *
   * All properties are optional — default values are applied via `transformEvaFullscreenAria`:
   * - `enterFullscreen` → `"Enter fullscreen"`
   * - `exitFullscreen` → `"Exit fullscreen"`
   */
  public readonly evaAria = input<EvaFullscreenAriaTransformed, EvaFullscreenAria>(transformEvaFullscreenAria(undefined), { transform: transformEvaFullscreenAria });

  /** Reactive signal tracking whether the player is currently in fullscreen mode. */
  protected readonly isFullscreen = signal(false);

  /**
   * Resolves the `aria-label` based on the current fullscreen state.
   * Returns `exitFullscreen` when in fullscreen, `enterFullscreen` otherwise.
   */
  protected readonly ariaLabel = computed(() => this.isFullscreen() ? this.evaAria().exitFullscreen : this.evaAria().enterFullscreen);

  /** Subscription to fullscreen state changes from `EvaFullscreenAPI`. Cleaned up in `ngOnDestroy`. */
  private fullscreenSubscription: Subscription | null = null;

  /**
   * Subscribes to `EvaFullscreenAPI.isFullscreenObs` to keep `isFullscreen`
   * in sync with the actual fullscreen state of the browser.
   */
  public ngOnInit(): void {
    this.fullscreenSubscription = this.fullscreenService.isFullscreenObs.subscribe(
      isFullscreen => {
        this.isFullscreen.set(isFullscreen);
      }
    );
  }

  /** Unsubscribes from the fullscreen state subscription to prevent memory leaks. */
  public ngOnDestroy(): void {
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
  protected async fullscreenClicked(): Promise<void> {
    try {
      await this.fullscreenService.toggleFullscreen();
    } catch (error) {
      console.warn('Failed to toggle fullscreen:', error);
    }
  }

  /**
   * Handles keyboard events on the host element.
   * Triggers fullscreen toggle on `Enter` or `Space` keypress.
   */
  protected fullscreenClickedKeyboard(k: KeyboardEvent): void {
    if (k.key === 'Enter' || k.key === ' ') {
      k.preventDefault();
      this.fullscreenClicked();
    }
  }
}