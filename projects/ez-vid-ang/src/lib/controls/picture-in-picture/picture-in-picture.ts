import { ChangeDetectionStrategy, Component, computed, inject, input, signal, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { transformEvaPictureInPictureAria, EvaPictureInPictureAria, EvaPictureInPictureAriaTransformed } from '../../utils/aria-utilities';

/**
 * Picture-in-Picture toggle button for the Eva video player.
 *
 * Subscribes to `EvaApi.pictureInPictureSubject` to track whether the player is
 * currently in PiP mode and updates its icon and ARIA attributes accordingly.
 * Delegates the actual PiP toggle to `EvaApi.changePictureInPictureStatus()`, which
 * handles browser support checks, the `disablePictureInPicture` guard, and correctly
 * exiting another element's PiP session before entering a new one.
 *
 * State is kept in sync with native browser events (`enterpictureinpicture` /
 * `leavepictureinpicture`) registered by `EvaApi`, so the button correctly reflects
 * PiP changes triggered externally (e.g. by the browser's native controls or another
 * player instance).
 *
 * Keyboard support:
 * - `Enter` (13) and `Space` (32) trigger the same action as a click.
 *
 * @example
 * // Minimal usage
 * <eva-picture-in-picture />
 *
 * @example
 * // With custom ARIA labels
 * <eva-picture-in-picture
 *   [evaAria]="{
 *     ariaLabel: 'Picture in picture',
 *     ariaValueText: {
 *       ariaLabelActivated: 'Exit picture-in-picture',
 *       ariaLabelDeactivated: 'Enter picture-in-picture'
 *     }
 *   }"
 * />
 *
 * @example
 * // With a custom icon
 * <eva-picture-in-picture [evaCustomIcon]="true">
 *   <my-pip-icon />
 * </eva-picture-in-picture>
 */
@Component({
  selector: 'eva-picture-in-picture',
  templateUrl: './picture-in-picture.html',
  styleUrl: './picture-in-picture.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "ariaLabel()",
    "[attr.aria-valuetext]": "ariaValueText()",
    "(click)": "pipClicked()",
    "(keydown)": "pipClickedKeyboard($event)"
  }
})
export class EvaPictureInPicture implements OnInit, OnDestroy {
  private readonly evaApi = inject(EvaApi);

  /**
   * When `true`, suppresses all built-in icon classes so you can project a
   * custom icon via content projection.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  /**
   * ARIA configuration for the PiP button.
   *
   * All properties are optional — defaults are applied via `transformEvaPictureInPictureAria`.
   * - `ariaLabel` — static label for the button element.
   * - `ariaValueText.ariaLabelActivated` — `aria-valuetext` when PiP is active.
   * - `ariaValueText.ariaLabelDeactivated` — `aria-valuetext` when PiP is inactive.
   */
  public readonly evaAria = input<EvaPictureInPictureAriaTransformed, EvaPictureInPictureAria>(
    transformEvaPictureInPictureAria(undefined),
    { transform: transformEvaPictureInPictureAria }
  );

  /**
   * Whether this player's video element is currently in Picture-in-Picture mode.
   * Updated by subscribing to `EvaApi.pictureInPictureSubject`.
   */
  protected readonly isPictureInPictureActive = signal(false);

  /**
   * Static `aria-label` for the host button element.
   * Sourced from `evaAria().ariaLabel` — does not change with PiP state.
   */
  protected readonly ariaLabel = computed(() => this.evaAria().ariaLabel);

  /**
   * Dynamic `aria-valuetext` for the host element.
   * Switches between `ariaValueText.ariaLabelActivated` and
   * `ariaValueText.ariaLabelDeactivated` based on the current PiP state,
   * giving screen readers a meaningful description of the current button action.
   */
  protected readonly ariaValueText = computed(() => this.isPictureInPictureActive()
    ? this.evaAria().ariaValueText.ariaLabelActivated
    : this.evaAria().ariaValueText.ariaLabelDeactivated);

  /** Subscription to `EvaApi.pictureInPictureSubject`. Cleaned up in `ngOnDestroy`. */
  private pip$: Subscription | null = null;

  /**
   * Subscribes to `EvaApi.pictureInPictureSubject` to keep `isPictureInPictureActive`
   * in sync with the native PiP state, including changes triggered externally by the browser.
   */
  public ngOnInit(): void {
    this.pip$ = this.evaApi.pictureInPictureSubject.subscribe((isActive) => {
      this.isPictureInPictureActive.set(isActive);
    });
  }

  /** Unsubscribes from `EvaApi.pictureInPictureSubject` to prevent memory leaks. */
  public ngOnDestroy(): void {
    this.pip$?.unsubscribe();
  }

  /**
   * Delegates the PiP toggle to `EvaApi.changePictureInPictureStatus()`.
   * Called on host click and from `pipClickedKeyboard`.
   */
  protected pipClicked(): void {
    this.evaApi.changePictureInPictureStatus();
  }

  /**
   * Handles keyboard events on the host element.
   * Triggers `pipClicked()` on `Enter` or `Space` keypress.
   *
   * @param k - The native `KeyboardEvent` from the host element.
   */
  protected pipClickedKeyboard(k: KeyboardEvent): void {
    if (k.key === 'Enter' || k.key === ' ') {
      k.preventDefault();
      this.pipClicked();
    }
  }
}