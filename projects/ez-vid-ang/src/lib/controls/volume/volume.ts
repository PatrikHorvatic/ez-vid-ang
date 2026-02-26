import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, OnDestroy, OnInit, Renderer2, signal, viewChild, WritableSignal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaVolumeAria, EvaVolumeAriaTransformed, transformEvaVolumeAria } from '../../utils/aria-utilities';

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
    "aria-level": "polite",
    "aria-orientation": "horizontal",
    "aria-valuemin": "0",
    "aria-valuemax": "100",
    "[attr.aria-label]": "ariaLabel()",
    "[attr.aria-valuetext]": "ariaValue()",
    "[class.eva-volume-focused]": "isFocused()"
  }
})
export class EvaVolume implements OnInit, OnDestroy {

  private evaAPI = inject(EvaApi);

  /** Used to attach and detach document-level `mousemove`, `mouseup`, `touchmove`, and `touchend` listeners. */
  private renderer = inject(Renderer2);

  /** Reference to the volume bar element used to calculate click/drag position relative to the bar's bounds. */
  readonly volumeBar = viewChild.required<ElementRef<HTMLDivElement>>('volumeBar');

  /**
   * ARIA label for the volume slider.
   *
   * All properties are optional — default values are applied via `transformEvaVolumeAria`.
   */
  readonly evaAria = input<EvaVolumeAriaTransformed, EvaVolumeAria>(transformEvaVolumeAria(undefined), { transform: transformEvaVolumeAria });

  /** Resolves the `aria-label` from the transformed aria input. */
  protected ariaLabel = computed<string>(() => {
    return this.evaAria().ariaLabel;
  });

  /** The current volume as a percentage integer string (e.g. `"72"`). Bound to `aria-valuetext`. */
  protected ariaValue = signal("0");

  /** Whether the user is currently dragging the volume bar. */
  protected isDragging = signal(false);

  /** Whether the volume slider currently has keyboard focus. Applies `eva-volume-focused` to the host. */
  protected isFocused = signal(false);

  /**
   * Controls the screen reader live region announcement for volume changes.
   * Set to `true` briefly after a debounced volume change, then reset to `false` after 100ms.
   */
  protected shouldAnnounceVolume = signal(false);

  /**
   * The `clientX` position recorded on `mousedown` or `touchstart`.
   * Used to distinguish a click (no movement) from a drag (position changed).
   * Reset to `-1` after drag ends.
   */
  protected mouseDownPosition: WritableSignal<number> = signal(-1);

  /** Reactive signal holding the current video volume as a normalized value (`0` to `1`). Initialized in `ngOnInit`. */
  protected videoVolume!: WritableSignal<number>;

  /** Subscription to volume changes from `EvaApi`. Cleaned up in `ngOnDestroy`. */
  private videoVolumeSub: Subscription | null = null;
  private playerReady$: Subscription | null = null;

  /** Cleanup function returned by `Renderer2.listen` for the `mousemove`/`touchmove` document listener. */
  private mouseMoveListener?: (() => void) | undefined;

  /** Cleanup function returned by `Renderer2.listen` for the `mouseup`/`touchend` document listener. */
  private mouseUpListener?: (() => void) | undefined;

  /** Reference to the debounce timeout for `announceVolumeChange`. Cleared on each new volume change. */
  private announceTimeout?: number;

  /**
   * Initializes `videoVolume` from `EvaApi.getVideoVolume()` and subscribes to
   * `EvaApi.videoVolumeSubject` to keep the signal and `ariaValue` in sync with
   * external volume changes (e.g. from the mute button).
   */
  ngOnInit(): void {
    const initialVolume = this.evaAPI.getVideoVolume();
    this.videoVolume = signal(initialVolume);

    if (!this.evaAPI.isPlayerReady) {
      this.playerReady$ = this.evaAPI.playerReadyEvent.subscribe(() => {
        // Initialize volume signal
        const initialVolume = this.evaAPI.getVideoVolume();
        this.videoVolume.set(initialVolume);
        this.ariaValue.set(String(Math.round(initialVolume * 100)));
      });
    }
    // Subscribe to volume changes from API
    this.videoVolumeSub = this.evaAPI.videoVolumeSubject.subscribe(volume => {
      if (volume !== null) {
        this.videoVolume.set(volume);
        this.ariaValue.set(String(Math.round(volume * 100)));
      }
    });
  }

  /**
   * Cleans up the volume subscription, removes any active document-level drag listeners,
   * and clears the announcement debounce timeout.
   */
  ngOnDestroy(): void {
    // Clean up subscription
    this.videoVolumeSub?.unsubscribe();
    this.playerReady$?.unsubscribe();

    // Clean up event listeners if component destroyed while dragging
    this.removeDocumentListeners();

    // Clean up announce timeout
    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
    }
  }

  /**
   * Handles a click on the volume bar.
   * Ignored if the event is the tail of a drag operation (i.e. `clientX` changed since `mousedown`).
   *
   * @param e - The native `MouseEvent` from the click.
   */
  protected onClick(e: MouseEvent) {
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
  protected onMouseDown(e: MouseEvent) {
    e.preventDefault(); // Prevent text selection while dragging

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
  private onDrag(event: MouseEvent) {
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
  private onStopDrag(event: MouseEvent) {
    if (this.isDragging()) {
      // Set final volume position and announce it
      this.setVolume(this.calculateVolume(event.clientX), true);

      // Reset dragging state
      this.isDragging.set(false);

      // Small timeout to prevent onClick from firing after drag
      setTimeout(() => {
        this.mouseDownPosition.set(-1);
      }, 10);

      // Remove document-level listeners
      this.removeDocumentListeners();
    }
  }

  /**
   * Calls the cleanup functions returned by `Renderer2.listen` to detach
   * the document-level `mousemove`/`mouseup` (or `touchmove`/`touchend`) listeners.
   */
  private removeDocumentListeners() {
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
  protected onKeyDown(event: KeyboardEvent) {
    const key = event.key;
    const currentVolume = this.videoVolume() * 100;
    let handled = true;

    switch (key) {
      case 'ArrowUp':
      case 'ArrowRight':
        event.preventDefault();
        this.setVolume(Math.min(100, currentVolume + 5), true);
        break;

      case 'ArrowDown':
      case 'ArrowLeft':
        event.preventDefault();
        this.setVolume(Math.max(0, currentVolume - 5), true);
        break;

      case 'PageUp':
        event.preventDefault();
        this.setVolume(Math.min(100, currentVolume + 10), true);
        break;

      case 'PageDown':
        event.preventDefault();
        this.setVolume(Math.max(0, currentVolume - 10), true);
        break;

      case 'Home':
        event.preventDefault();
        this.setVolume(100, true);
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
  private setVolume(vol: number, announce: boolean = false) {
    const clampedVol = Math.max(0, Math.min(100, vol));
    const normalizedVolume = clampedVol / 100;
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
  private announceVolumeChange() {
    // Clear existing timeout
    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
    }

    // Debounce announcements by 300ms
    this.announceTimeout = window.setTimeout(() => {
      this.shouldAnnounceVolume.set(true);

      // Reset announcement after screen reader has time to read it
      setTimeout(() => {
        this.shouldAnnounceVolume.set(false);
      }, 100);
    }, 300);
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
    const percentage = ((mousePosX - volumeBarOffsetLeft) / volumeBarWidth) * 100;

    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, percentage));
  }

  /**
   * Begins a touch drag on the volume bar.
   * Equivalent to `onMouseDown` but for touch events. Attaches document-level
   * `touchmove` and `touchend` listeners via `Renderer2`.
   *
   * @param e - The native `TouchEvent` from `touchstart`.
   */
  protected onTouchStart(e: TouchEvent) {
    e.preventDefault();
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
        }, 10);
        this.removeDocumentListeners();
      }
    });
  }

  /** Sets `isFocused` to `true` when the slider receives focus, enabling `eva-volume-focused` styling. */
  protected onFocus() {
    this.isFocused.set(true);
  }

  /** Sets `isFocused` to `false` when the slider loses focus, removing `eva-volume-focused` styling. */
  protected onBlur() {
    this.isFocused.set(false);
  }
}