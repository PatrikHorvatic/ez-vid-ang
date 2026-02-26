import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaPlaybackSpeedAria, EvaPlaybackSpeedAriaTransformed, transformEvaPlaybackSpeedAria } from '../../utils/aria-utilities';
import { transformDefaultPlaybackSpeed, validateAndTransformPlaybackSpeeds } from '../../utils/utilities';
import { Subscription } from 'rxjs';

/**
 * Playback speed selector component for the Eva video player.
 *
 * Renders as a `role="button"` element with `tabindex="0"` that opens a dropdown
 * of available playback speeds when clicked. The current speed is reflected in
 * `aria-valuetext` as e.g. `"1x"`.
 *
 * The dropdown closes when:
 * - A speed is selected
 * - Focus moves outside the component (`blur`)
 * - A click is detected outside the component
 * - `Escape` is pressed
 *
 * Keyboard support:
 * - `Enter` / `Space` — open/close the dropdown
 * - `ArrowUp` / `ArrowDown` — navigate and select speeds
 * - `Home` — jump to the first speed
 * - `End` — jump to the last speed
 * - `Escape` — close the dropdown
 *
 * @example
 * // Minimal usage — speeds are required
 * <eva-playback-speed [evaPlaybackSpeeds]="[0.5, 1, 1.5, 2]" />
 *
 * @example
 * // With a default speed and custom ARIA label
 * <eva-playback-speed
 *   [evaPlaybackSpeeds]="[0.5, 1, 1.5, 2]"
 *   [evaDefaultPlaybackSpeed]="1.5"
 *   [evaAria]="{ ariaLabel: 'Video speed' }"
 * />
 */
@Component({
  selector: 'eva-playback-speed',
  templateUrl: './playback-speed.html',
  styleUrl: './playback-speed.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "ariaLabel()",
    "[attr.aria-valuetext]": "currentSpeed() + 'x'",
    "[class.open]": "isOpen()",
    "(click)": "playbackClicked()",
    "(keydown)": "playbackClickedKeyboard($event)",
    "(blur)": "handleBlur($event)"
  }
})
export class EvaPlaybackSpeed implements OnInit, OnDestroy {

  private evaAPI = inject(EvaApi);

  /**
   * The list of available playback speeds to display in the dropdown.
   *
   * **Required.** Values are validated and transformed via `validateAndTransformPlaybackSpeeds`:
   * - Accepted range: `0.25` to `4`. Values outside this range are removed.
   * - Duplicate values are removed to ensure stable `@for` loop tracking.
   * - If the resulting array is empty, the component falls back to `1.0`.
   *
   * **It is your responsibility to sort the values** in the desired display order.
   */
  readonly evaPlaybackSpeeds = input.required<Array<number>, Array<number>>({
    transform: validateAndTransformPlaybackSpeeds
  });

  /**
   * The speed that should be pre-selected when the component initializes.
   * Must be present in `evaPlaybackSpeeds` to take effect — if not found,
   * the first speed in the array is selected instead.
   *
   * Transformed via `transformDefaultPlaybackSpeed`.
   *
   * @default 1
   */
  readonly evaDefaultPlaybackSpeed = input<number, number>(1, {
    transform: transformDefaultPlaybackSpeed
  });

  /**
   * ARIA label for the playback speed button.
   *
   * All properties are optional — default values are applied via `transformEvaPlaybackSpeedAria`:
   * - `ariaLabel` → `"Playback speed"`
   */
  readonly evaAria = input<EvaPlaybackSpeedAriaTransformed, EvaPlaybackSpeedAria>(transformEvaPlaybackSpeedAria(undefined), { transform: transformEvaPlaybackSpeedAria });

  /** Resolves the `aria-label` from the transformed aria input. */
  protected ariaLabel = computed<string>(() => {
    return this.evaAria().ariaLabel;
  });

  /** Whether the speed dropdown is currently open. Applies the `open` class to the host. */
  protected isOpen = signal(false);

  /** The currently selected playback speed. Reflected in `aria-valuetext` as e.g. `"1.5x"`. */
  protected currentSpeed = signal(1);

  /** The index of the currently selected speed within `evaPlaybackSpeeds`. Used for keyboard navigation. */
  protected selectedIndex = signal(0);

  /** Bound reference to the click-outside handler, stored for removal in `ngOnDestroy`. */
  private clickOutsideListener?: (event: MouseEvent) => void;

  private playerReady$: Subscription | null = null;

  /**
   * Sets the initial playback speed based on `evaDefaultPlaybackSpeed` and `evaPlaybackSpeeds`,
   * then attaches a document-level click listener to close the dropdown when clicking outside.
   */
  ngOnInit(): void {
    if (!this.evaAPI.isPlayerReady) {
      this.playerReady$ = this.evaAPI.playerReadyEvent.subscribe(() => {
        const speeds = this.evaPlaybackSpeeds();
        const defaultSpeed = this.evaDefaultPlaybackSpeed();
        const index = speeds.indexOf(defaultSpeed);

        if (index !== -1) {
          this.currentSpeed.set(defaultSpeed);
          this.selectedIndex.set(index);
        } else if (speeds.length > 0) {
          this.currentSpeed.set(speeds[0]);
          this.selectedIndex.set(0);
        }

        this.evaAPI.setPlaybackSpeed(index !== 1 ? defaultSpeed : speeds[0]);
      });
    }

    // Listen for clicks outside
    this.clickOutsideListener = this.handleClickOutside.bind(this);
    document.addEventListener('click', this.clickOutsideListener, true);
  }

  /** Removes the document-level click-outside listener to prevent memory leaks. */
  ngOnDestroy(): void {
    this.playerReady$?.unsubscribe();
    if (this.clickOutsideListener) {
      document.removeEventListener('click', this.clickOutsideListener, true);
    }
  }

  /** Toggles the dropdown open/closed on click. */
  protected playbackClicked() {
    this.toggleDropdown();
  }

  /**
   * Handles keyboard navigation for the dropdown.
   *
   * - `Enter` / `Space` — toggle the dropdown
   * - `ArrowUp` — select the previous speed (or open if closed)
   * - `ArrowDown` — select the next speed (or open if closed)
   * - `Escape` — close the dropdown
   * - `Home` — select the first speed (only when open)
   * - `End` — select the last speed (only when open)
   */
  protected playbackClickedKeyboard(e: KeyboardEvent) {
    const isOpen = this.isOpen();
    const speeds = this.evaPlaybackSpeeds();
    const currentIndex = this.selectedIndex();

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.toggleDropdown();
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen && currentIndex > 0) {
          this.selectSpeed(speeds[currentIndex - 1], currentIndex - 1);
        } else if (!isOpen) {
          this.isOpen.set(true);
          this.evaAPI.controlsSelectorComponentActive.next(true);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (isOpen && currentIndex < speeds.length - 1) {
          this.selectSpeed(speeds[currentIndex + 1], currentIndex + 1);
        } else if (!isOpen) {
          this.isOpen.set(true);
          this.evaAPI.controlsSelectorComponentActive.next(true);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.isOpen.set(false);
        this.evaAPI.controlsSelectorComponentActive.next(false);
        break;

      case 'Home':
        if (isOpen) {
          e.preventDefault();
          this.selectSpeed(speeds[0], 0);
        }
        break;

      case 'End':
        if (isOpen) {
          e.preventDefault();
          const lastIndex = speeds.length - 1;
          this.selectSpeed(speeds[lastIndex], lastIndex);
        }
        break;
    }
  }

  /**
   * Closes the dropdown when focus moves outside the `eva-playback-speed` element.
   * Uses `relatedTarget` to detect where focus is moving to.
   */
  protected handleBlur(event: FocusEvent) {
    // Close dropdown when focus moves outside the component
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('eva-playback-speed')) {
      this.isOpen.set(false);
      this.evaAPI.controlsSelectorComponentActive.next(false);
    }
  }

  /**
   * Selects a playback speed, updates `currentSpeed` and `selectedIndex`,
   * closes the dropdown, and notifies `EvaApi` of the change.
   *
   * @param speed - The speed value to select.
   * @param index - The index of the speed within `evaPlaybackSpeeds`.
   */
  protected selectSpeed(speed: number, index: number) {
    this.currentSpeed.set(speed);
    this.selectedIndex.set(index);
    this.isOpen.set(false);
    this.evaAPI.controlsSelectorComponentActive.next(false);
    this.evaAPI.setPlaybackSpeed(speed);
  }

  /**
   * Formats a speed value for display in the dropdown.
   * Returns `"Normal"` for `1`, otherwise returns e.g. `"1.5x"`.
   *
   * @param speed - The speed value to format.
   */
  protected formatSpeed(speed: number): string {
    return speed === 1 ? 'Normal' : `${speed}x`;
  }

  /** Toggles the `isOpen` signal between `true` and `false`. */
  private toggleDropdown() {
    this.isOpen.update(open => !open);
    this.evaAPI.controlsSelectorComponentActive.next(this.isOpen());
  }

  /**
   * Document-level click handler that closes the dropdown when a click
   * is detected outside the `eva-playback-speed` element.
   *
   * @param event - The native `MouseEvent` from the document listener.
   */
  private handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('eva-playback-speed')) {
      this.isOpen.set(false);
      this.evaAPI.controlsSelectorComponentActive.next(false);
    }
  }
}