import { ChangeDetectionStrategy, Component, computed, inject, input, signal, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { EvaApi } from "../../api/eva-api";
import { EvaQualityLevel } from "../../types";
import { EvaQualityAria } from "../../utils/aria-utilities";

/**
 * Quality/bitrate selector component for the Eva video player.
 *
 * Renders a dropdown listing all available stream quality levels sourced from
 * `EvaApi.qualityLevelsSubject`. When the user selects a level, the component
 * calls `EvaApi.setQuality()`, which delegates to whichever streaming directive
 * (HLS or DASH) has registered its quality setter via `EvaApi.registerQualityFn()`.
 *
 * The component has no direct knowledge of the streaming library — all quality
 * switching is fully routed through `EvaApi`.
 *
 * The dropdown closes when:
 * - A quality is selected
 * - Focus moves outside the component (`blur`)
 * - A click is detected outside the component
 * - `Escape` is pressed
 *
 * Keyboard support:
 * - `Enter` / `Space` — open/close the dropdown
 * - `ArrowUp` / `ArrowDown` — navigate and select quality levels
 * - `Home` — jump to the first quality
 * - `End` — jump to the last quality
 * - `Escape` — close the dropdown
 *
 * @example
 * // Minimal — quality levels are populated automatically via EvaApi
 * <eva-quality-selector />
 *
 * @example
 * // With custom labels
 * <eva-quality-selector
 *   evaQualitySelectorText="Resolution"
 *   evaQualityAutoText="Best"
 * />
 */
@Component({
  selector: "eva-quality-selector",
  templateUrl: "./quality-selector.html",
  styleUrl: "./quality-selector.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    tabindex: "0",
    role: "button",
    "[attr.aria-label]": "ariaLabel()",
    "[attr.aria-valuetext]": "currentQuality()?.label ?? evaQualityAutoText()",
    "[class.open]": "isOpen()",
    "(click)": "onClicked()",
    "(keydown)": "onKeyDown($event)",
    "(blur)": "onBlur($event)",
  },
})
export class EvaQualitySelector implements OnInit, OnDestroy {
  protected evaAPI = inject(EvaApi);

  /**
   * Label shown in the dropdown header.
   *
   * @default "Quality selector"
   */
  public readonly evaQualitySelectorText = input<string>("Quality selector");

  /**
   * Label used for the Auto (ABR) quality option.
   *
   * @default "Auto"
   */
  public readonly evaQualityAutoText = input<string>("Auto");

  /**
   * ARIA label for the quality selector button.
   */
  public readonly evaAria = input<EvaQualityAria>({ ariaLabel: "Quality selector" });

  /** Resolves the `aria-label` from the aria input. */
  protected readonly ariaLabel = computed<string>(() => this.evaAria().ariaLabel ?? "Quality selector");

  /** Whether the dropdown is currently open. */
  protected readonly isOpen = signal(false);

  /** The list of available quality levels, sourced from `EvaApi.qualityLevelsSubject`. */
  protected readonly qualities = signal<EvaQualityLevel[]>([]);

  /**
   * The currently selected quality level, derived from `EvaApi.currentQualityIndex()`.
   * Being a `computed()` (rather than a signal only written by this component's own
   * `selectQuality()`) keeps the dropdown in sync with quality changes made outside it —
   * the "next/previous quality" keyboard shortcuts, or hls.js's automatic ABR switching —
   * not just clicks/keyboard input on this component itself.
   * Falls back to the Auto option (or the first level) if the current index isn't in the list.
   */
  protected readonly currentQuality = computed<EvaQualityLevel | null>(() => {
    const levels = this.qualities();
    if (!levels.length) {
      return null;
    }
    const index = this.evaAPI.currentQualityIndex();
    return levels.find((q) => q.qualityIndex === index) ?? levels.find((q) => q.isAuto) ?? levels[0];
  });

  /** Index used for keyboard navigation within the quality list. */
  private readonly keyboardIndex = signal(0);

  /** Subscription to quality level changes from `EvaApi`. Cleaned up in `ngOnDestroy`. */
  private qualityLevelsSub: Subscription | null = null;

  /** Subscription used for mutual exclusion with other dropdowns/menus. Cleaned up in `ngOnDestroy`. */
  private activeSelectorSub: Subscription | null = null;

  /** Unique identity used with `EvaApi.claimSelector()`/`releaseSelector()` for mutual exclusion. */
  private readonly selectorId = Symbol("quality-selector");

  /** Bound reference to the click-outside handler for cleanup in `ngOnDestroy`. */
  private clickOutsideListener?: (event: MouseEvent) => void;

  /**
   * Subscribes to `EvaApi.qualityLevelsSubject` to keep the dropdown in sync
   * with quality levels registered by the active streaming directive.
   * Attaches a document-level click listener to close on outside clicks.
   * Also subscribes to `EvaApi.activeSelectorSubject` so this dropdown closes itself
   * when a different dropdown/menu (e.g. `EvaSettingsPanel`) opens.
   */
  public ngOnInit(): void {
    this.qualityLevelsSub = this.evaAPI.qualityLevelsSubject.subscribe((levels) => {
      this.qualities.set(levels);

      // Keep keyboard navigation aligned with whichever level is actually active.
      const currentIndex = this.evaAPI.currentQualityIndex();
      const idx = levels.findIndex((q) => q.qualityIndex === currentIndex);
      this.keyboardIndex.set(idx >= 0 ? idx : 0);
    });

    this.activeSelectorSub = this.evaAPI.activeSelectorSubject.subscribe((id) => {
      if (id !== this.selectorId && this.isOpen()) {
        this.isOpen.set(false);
      }
    });

    this.clickOutsideListener = this.handleClickOutside.bind(this);
    document.addEventListener("click", this.clickOutsideListener, true);
  }

  /** Unsubscribes, removes the document-level click listener, and releases the selector claim. */
  public ngOnDestroy(): void {
    this.qualityLevelsSub?.unsubscribe();
    this.activeSelectorSub?.unsubscribe();
    this.evaAPI.releaseSelector(this.selectorId);
    if (this.clickOutsideListener) {
      document.removeEventListener("click", this.clickOutsideListener, true);
    }
  }

  /** Toggles the dropdown open/closed on click. */
  protected onClicked(): void {
    this.toggleDropdown();
  }

  /**
   * Selects a quality level, updates `currentQuality`, and calls `EvaApi.setQuality()`
   * which delegates to the registered streaming library quality setter.
   *
   * @param quality - The quality level to select.
   * @param index - Its index within `qualities`.
   */
  protected selectQuality(quality: EvaQualityLevel, index: number, event?: MouseEvent): void {
    event?.stopPropagation();
    this.keyboardIndex.set(index);
    this.closeDropdown();
    this.evaAPI.setQuality(quality.qualityIndex);
  }

  /**
   * Returns the display label for a quality level.
   * Uses `evaQualityAutoText` for Auto options, otherwise uses `quality.label`.
   */
  protected formatQuality(quality: EvaQualityLevel): string {
    return quality.isAuto ? this.evaQualityAutoText() : quality.label;
  }

  /**
   * Handles keyboard navigation for the dropdown.
   *
   * - `Enter` / `Space` — toggle the dropdown
   * - `ArrowDown` — open dropdown or select next quality
   * - `ArrowUp` — open dropdown or select previous quality
   * - `Home` — select the first quality (only when open)
   * - `End` — select the last quality (only when open)
   * - `Escape` — close the dropdown
   */
  protected onKeyDown(e: KeyboardEvent): void {
    const qualities = this.qualities();
    if (!qualities.length) {
      return;
    }
    const isOpen = this.isOpen();
    const currentIndex = this.keyboardIndex();

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        e.stopPropagation();
        this.toggleDropdown();
        break;

      case "ArrowDown":
        e.preventDefault();
        e.stopPropagation();
        if (!isOpen) {
          this.openDropdown();
        } else {
          const next = Math.min(currentIndex + 1, qualities.length - 1);
          this.selectQuality(qualities[next], next);
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        e.stopPropagation();
        if (!isOpen) {
          this.openDropdown();
        } else {
          const prev = Math.max(currentIndex - 1, 0);
          this.selectQuality(qualities[prev], prev);
        }
        break;

      case "Home":
        if (isOpen) {
          e.preventDefault();
          e.stopPropagation();
          this.selectQuality(qualities[0], 0);
        }
        break;

      case "End":
        if (isOpen) {
          e.preventDefault();
          e.stopPropagation();
          const last = qualities.length - 1;
          this.selectQuality(qualities[last], last);
        }
        break;

      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        this.closeDropdown();
        break;

      default:
        break;
    }
  }

  /** Closes the dropdown when focus moves outside the `eva-quality-selector` element. */
  protected onBlur(event: FocusEvent): void {
    const related = event.relatedTarget;
    if (!(related instanceof HTMLElement) || !related.closest("eva-quality-selector")) {
      this.closeDropdown();
    }
  }

  private toggleDropdown(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  /** Opens the dropdown and claims exclusive ownership of the open dropdown UI. */
  private openDropdown(): void {
    this.isOpen.set(true);
    this.evaAPI.claimSelector(this.selectorId);
  }

  /** Closes the dropdown and releases its claim (a no-op if it already lost the claim to another dropdown). */
  private closeDropdown(): void {
    this.isOpen.set(false);
    this.evaAPI.releaseSelector(this.selectorId);
  }

  private handleClickOutside(event: MouseEvent): void {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }
    if (!event.target.closest("eva-quality-selector")) {
      this.closeDropdown();
    }
  }
}
