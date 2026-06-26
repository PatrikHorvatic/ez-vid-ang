import { ChangeDetectionStrategy, Component, computed, inject, input, Renderer2, signal, viewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { transformEvaVolumeAria, EvaVolumeAria, EvaVolumeAriaTransformed } from '../../utils/aria-utilities';
import { PERCENTAGE, VOLUME_ARROW_KEY_STEP, VOLUME_PAGE_KEY_STEP, VOLUME_ANNOUNCE_DEBOUNCE_MS, VOLUME_ANNOUNCE_RESET_MS, POST_DRAG_CLICK_SUPPRESS_MS } from '../../constants';

/**
 * Volume slider component for the Eva video player.
 *
 * Renders as a `role="slider"` element with `tabindex="0"`, exposing the current
 * volume as a percentage integer via `aria-valuetext` (e.g. `"72"`). The range is
 * always `0` to `100` with horizontal orientation.
 *
 * Interaction modes:
 * - **Click** — sets volume to the clicked position on the bar.
 * - **Click and drag** — attaches document-level `mousemove`/`mouseup` listeners via
 *   `Renderer2` for smooth dragging. Listeners are cleaned up on `mouseup` or `ngOnDestroy`.
 * - **Touch** — equivalent drag behaviour using `touchmove`/`touchend`.
 * - **Keyboard** — fine and coarse volume adjustment (see below).
 *
 * Screen reader support:
 * - Volume changes are announced via `shouldAnnounceVolume`, debounced at 300ms to
 *   avoid excessive announcements during rapid input. The signal resets after 100ms.
 * - `eva-volume-focused` class is applied to the host when the element has focus,
 *   enabling focus-visible styling.
 *
 * Keyboard support (when focused):
 * - `ArrowUp` / `ArrowRight` — increase volume by 5%
 * - `ArrowDown` / `ArrowLeft` — decrease volume by 5%
 * - `PageUp` — increase volume by 10%
 * - `PageDown` — decrease volume by 10%
 * - `Home` — set volume to 100%
 * - `End` — mute (set volume to 0%)
 *
 * @example
 * // Minimal usage
 * <eva-volume />
 *
 * @example
 * // Custom ARIA label
 * <eva-volume [evaAria]="{ ariaLabel: 'Video volume' }" />
 */
@Component({
  selector: 'eva-volume',
  templateUrl: './volume.html',
  styleUrl: './volume.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "slider",
    "aria-orientation": "horizontal",
    "aria-valuemin": "0",
    "aria-valuemax": "100",
    "[attr.aria-label]": "ariaLabel()",
    "[attr.aria-valuenow]": "ariaValue()",
    "[attr.aria-valuetext]": "ariaValue() + ' percent'",
    "[class.eva-volume-focused]": "isFocused()",
    "(click)": "onClick($event)",
    "(mousedown)": "onMouseDown($event)",
    "(keydown)": "onKeyDown($event)",
    "(touchstart)": "onTouchStart($event)",
    "(focus)": "onFocus()",
    "(blur)": "onBlur()"
  }
})
export class EvaVolume implements OnInit, OnDestroy {
  private readonly evaAPI = inject(EvaApi);

  /** Used to attach and detach document-level `mousemove`, `mouseup`, `touchmove`, and `touchend` listeners. */
  private readonly renderer = inject(Renderer2);

  /** Reference to the volume bar element used to calculate click/drag position relative to the bar's bounds. */
  public readonly volumeBar = viewChild.required<ElementRef<HTMLDivElement>>('volumeBar');

  /**
   * ARIA label for the volume slider.
   *
   * All properties are optional — default values are applied via `transformEvaVolumeAria`.
   */
  public readonly evaAria = input<EvaVolumeAriaTransformed, EvaVolumeAria>(transformEvaVolumeAria(undefined), { transform: transformEvaVolumeAria });

  /** Resolves the `aria-label` from the transformed aria input. */
  protected readonly ariaLabel = computed<string>(() => this.evaAria().ariaLabel);

  /** The current volume as a percentage integer string (e.g. `"72"`). Bound to `aria-valuetext`. */
  protected readonly ariaValue = signal("0");

  /** Whether the user is currently dragging the volume bar. */
  protected readonly isDragging = signal(false);

  /** Whether the volume slider currently has keyboard focus. Applies `eva-volume-focused` to the host. */
  protected readonly isFocused = signal(false);

  /**
   * Controls the screen reader live region announcement for volume changes.
   * Set to `true` briefly after a debounced volume change, then reset to `false` after 100ms.
   */
  protected readonly shouldAnnounceVolume = signal(false);

  /**
   * The `clientX` position recorded on `mousedown` or `touchstart`.
   * Used to distinguish a click (no movement) from a drag (position changed).
   * Reset to `-1` after drag ends.
   */
  protected readonly mouseDownPosition = signal(-1);

  /** Reactive signal holding the current video volume as a normalized value (`0` to `1`). */
  protected readonly videoVolume = signal(0);

  /** Subscription to volume changes from `EvaApi`. Cleaned up in `ngOnDestroy`. */
  private videoVolumeSub: Subscription | null = null;
  private playerReady$: Subscription | null = null;

  /** Cleanup function returned by `Renderer2.listen` for the `mousemove`/`touchmove` document listener. */
  private mouseMoveListener?: (() => void) | undefined;

  /** Cleanup function returned by `Renderer2.listen` for the `mouseup`/`touchend` document listener. */
  private mouseUpListener?: (() => void) | undefined;

  /** Reference to the debounce timeout for `announceVolumeChange`. Cleared on each new volume change. */
  private announceTimeout?: number;
  private announceResetTimeout?: number;

  /**
   * Initializes `videoVolume` from `EvaApi.getVideoVolume()` and subscribes to
   * `EvaApi.videoVolumeSubject` to keep the signal and `ariaValue` in sync with
   * external volume changes (e.g. from the mute button).
   */
  public ngOnInit(): void {
    this.videoVolume.set(this.evaAPI.getVideoVolume());

    if (!this.evaAPI.isPlayerReady) {
      this.playerReady$ = this.evaAPI.playerReadyEvent.subscribe(() => {
        // Initialize volume signal
        const initialVolume = this.evaAPI.getVideoVolume();
        this.videoVolume.set(initialVolume);
        this.ariaValue.set(String(Math.round(initialVolume * PERCENTAGE)));
      });
    }
    // Subscribe to volume changes from API
    this.videoVolumeSub = this.evaAPI.videoVolumeSubject.subscribe(volume => {
      if (volume !== null) {
        this.videoVolume.set(volume);
        this.ariaValue.set(String(Math.round(volume * PERCENTAGE)));
      }
    });
  }

  /**
   * Cleans up the volume subscription, removes any active document-level drag listeners,
   * and clears the announcement debounce timeout.
   */
  public ngOnDestroy(): void {
    // Clean up subscription
    this.videoVolumeSub?.unsubscribe();
    this.playerReady$?.unsubscribe();

    // Clean up event listeners if component destroyed while dragging
    this.removeDocumentListeners();

    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
    }
    if (this.announceResetTimeout) {
      clearTimeout(this.announceResetTimeout);
    }
  }

  /**
   * Handles a click on the volume bar.
   * Ignored if the event is the tail of a drag operation (i.e. `clientX` changed since `mousedown`).
   *
   * @param e - The native `MouseEvent` from the click.
   */
  protected onClick(e: MouseEvent): void {
    // Prevent click event if this was actually a drag operation
    if (this.mouseDownPosition() !== -1 && this.mouseDownPosition() !== e.clientX) {
      return;
    }

    this.setVolume(this.calculateVolume(e.clientX), true);
  }

  /**
   * Begins a mouse drag on the volume bar.
   * Records the initial `clientX`, sets the volume at the pressed position, and attaches
   * document-level `mousemove` and `mouseup` listeners via `Renderer2`.
   *
   * @param e - The native `MouseEvent` from `mousedown`.
   */
  protected onMouseDown(e: MouseEvent): void {
    e.preventDefault();

    this.mouseDownPosition.set(e.clientX);
    this.isDragging.set(true);

    // Set initial volume at mousedown position
    this.setVolume(this.calculateVolume(e.clientX), false);

    // Attach document-level mousemove listener
    this.mouseMoveListener = this.renderer.listen('document', 'mousemove', (event: MouseEvent) => {
      this.onDrag(event);
    });

    // Attach document-level mouseup listener
    this.mouseUpListener = this.renderer.listen('document', 'mouseup', (event: MouseEvent) => {
      this.onStopDrag(event);
    });
  }

  /**
   * Updates volume continuously while the user drags.
   * Only active when `isDragging` is `true`.
   *
   * @param event - The native `MouseEvent` from the document `mousemove` listener.
   */
  private onDrag(event: MouseEvent): void {
    if (this.isDragging()) {
      event.preventDefault();
      this.setVolume(this.calculateVolume(event.clientX), false);
    }
  }

  /**
   * Finalizes a drag operation on `mouseup`.
   * Sets the final volume, resets dragging state, delays `mouseDownPosition` reset by 10ms
   * to prevent the subsequent `click` event from re-triggering a seek, then removes document listeners.
   *
   * @param event - The native `MouseEvent` from the document `mouseup` listener.
   */
  private onStopDrag(event: MouseEvent): void {
    if (this.isDragging()) {
      // Set final volume position and announce it
      this.setVolume(this.calculateVolume(event.clientX), true);

      // Reset dragging state
      this.isDragging.set(false);

      // Small timeout to prevent onClick from firing after drag
      setTimeout(() => {
        this.mouseDownPosition.set(-1);
      }, POST_DRAG_CLICK_SUPPRESS_MS);

      // Remove document-level listeners
      this.removeDocumentListeners();
    }
  }

  /**
   * Calls the cleanup functions returned by `Renderer2.listen` to detach
   * the document-level `mousemove`/`mouseup` (or `touchmove`/`touchend`) listeners.
   */
  private removeDocumentListeners(): void {
    this.mouseMoveListener?.();
    this.mouseUpListener?.();
    this.mouseMoveListener = undefined;
    this.mouseUpListener = undefined;
  }

  /**
   * Handles keyboard volume adjustment when the slider is focused.
   *
   * - `ArrowUp` / `ArrowRight` — increase volume by 5%
   * - `ArrowDown` / `ArrowLeft` — decrease volume by 5%
   * - `PageUp` — increase volume by 10%
   * - `PageDown` — decrease volume by 10%
   * - `Home` — set volume to 100%
   * - `End` — mute (set volume to 0%)
   *
   * A screen reader announcement is triggered via `announceVolumeChange()` only if
   * the key was handled.
   *
   * @param event - The native `KeyboardEvent` from the host `keydown` listener.
   */
  protected onKeyDown(event: KeyboardEvent): void {
    const { key } = event;
    const currentVolume = this.videoVolume() * PERCENTAGE;
    let handled = true;

    switch (key) {
      case 'ArrowUp':
      case 'ArrowRight':
        event.preventDefault();
        this.setVolume(Math.min(PERCENTAGE, currentVolume + VOLUME_ARROW_KEY_STEP), true);
        break;

      case 'ArrowDown':
      case 'ArrowLeft':
        event.preventDefault();
        this.setVolume(Math.max(0, currentVolume - VOLUME_ARROW_KEY_STEP), true);
        break;

      case 'PageUp':
        event.preventDefault();
        this.setVolume(Math.min(PERCENTAGE, currentVolume + VOLUME_PAGE_KEY_STEP), true);
        break;

      case 'PageDown':
        event.preventDefault();
        this.setVolume(Math.max(0, currentVolume - VOLUME_PAGE_KEY_STEP), true);
        break;

      case 'Home':
        event.preventDefault();
        this.setVolume(PERCENTAGE, true);
        break;

      case 'End':
        event.preventDefault();
        this.setVolume(0, true);
        break;

      default:
        handled = false;
        break;
    }

    // Announce to screen readers only if key was handled
    if (handled) {
      this.announceVolumeChange();
    }
  }

  /**
   * Sets the video volume, clamping the input to `[0, 100]`, normalizing it to `[0, 1]`
   * for `EvaApi`, and updating `ariaValue`. Optionally triggers a debounced screen reader announcement.
   *
   * @param vol - Volume as a percentage (`0`–`100`).
   * @param announce - When `true`, triggers `announceVolumeChange()` after setting the volume.
   */
  private setVolume(vol: number, announce = false): void {
    const clampedVol = Math.max(0, Math.min(PERCENTAGE, vol));
    const normalizedVolume = clampedVol / PERCENTAGE;
    this.evaAPI.setVideoVolume(normalizedVolume);
    this.ariaValue.set(String(Math.round(clampedVol)));

    if (announce) {
      this.announceVolumeChange();
    }
  }

  /**
   * Triggers a debounced screen reader announcement of the current volume.
   *
   * Sets `shouldAnnounceVolume` to `true` after a 300ms debounce, then resets it to
   * `false` after 100ms — giving the live region enough time to be read without
   * remaining active indefinitely.
   *
   * Any pending announcement is cancelled when a new volume change arrives within the debounce window.
   */
  private announceVolumeChange(): void {
    // Clear existing timeout
    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
    }

    // Debounce announcements by 300ms
    this.announceTimeout = window.setTimeout(() => {
      this.shouldAnnounceVolume.set(true);

      // Reset announcement after screen reader has time to read it
      this.announceResetTimeout = window.setTimeout(() => {
        this.shouldAnnounceVolume.set(false);
      }, VOLUME_ANNOUNCE_RESET_MS);
    }, VOLUME_ANNOUNCE_DEBOUNCE_MS);
  }

  /**
   * Calculates the volume percentage from a horizontal mouse or touch position
   * relative to the volume bar's bounding rect.
   *
   * The result is clamped to `[0, 100]`.
   *
   * @param mousePosX - The `clientX` value from a `MouseEvent` or `TouchEvent`.
   * @returns Volume as a percentage (`0`–`100`).
   */
  protected calculateVolume(mousePosX: number): number {
    const recObj = this.volumeBar().nativeElement.getBoundingClientRect();
    const volumeBarOffsetLeft = recObj.left;
    const volumeBarWidth = recObj.width;

    // Calculate percentage based on mouse position
    const percentage = ((mousePosX - volumeBarOffsetLeft) / volumeBarWidth) * PERCENTAGE;

    // Clamp between 0 and 100
    return Math.max(0, Math.min(PERCENTAGE, percentage));
  }

  /**
   * Begins a touch drag on the volume bar.
   * Equivalent to `onMouseDown` but for touch events. Attaches document-level
   * `touchmove` and `touchend` listeners via `Renderer2`.
   *
   * @param e - The native `TouchEvent` from `touchstart`.
   */
  protected onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (!e.touches.length) { return; }
    const touch = e.touches[0];

    this.mouseDownPosition.set(touch.clientX);
    this.isDragging.set(true);

    // Set initial volume
    this.setVolume(this.calculateVolume(touch.clientX), false);

    this.mouseMoveListener = this.renderer.listen('document', 'touchmove', (event: TouchEvent) => {
      event.preventDefault();
      const touchMove = event.touches[0];
      if (this.isDragging()) {
        this.setVolume(this.calculateVolume(touchMove.clientX), false);
      }
    });

    this.mouseUpListener = this.renderer.listen('document', 'touchend', () => {
      if (this.isDragging()) {
        // Announce final volume after touch ends
        this.announceVolumeChange();

        this.isDragging.set(false);
        setTimeout(() => {
          this.mouseDownPosition.set(-1);
        }, POST_DRAG_CLICK_SUPPRESS_MS);
        this.removeDocumentListeners();
      }
    });
  }

  /** Sets `isFocused` to `true` when the slider receives focus, enabling `eva-volume-focused` styling. */
  protected onFocus(): void {
    this.isFocused.set(true);
  }

  /** Sets `isFocused` to `false` when the slider loses focus, removing `eva-volume-focused` styling. */
  protected onBlur(): void {
    this.isFocused.set(false);
  }
}