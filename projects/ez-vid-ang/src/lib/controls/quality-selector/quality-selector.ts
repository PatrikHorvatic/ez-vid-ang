import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaQualityLevel } from '../../types';
import { EvaQualityAria } from '../../utils/aria-utilities';

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
  selector: 'eva-quality-selector',
  templateUrl: './quality-selector.html',
  styleUrl: './quality-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'tabindex': '0',
    'role': 'button',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-valuetext]': 'currentQuality()?.label ?? evaQualityAutoText()',
    '[class.open]': 'isOpen()',
    '(click)': 'onClicked()',
    '(keydown)': 'onKeyDown($event)',
    '(blur)': 'onBlur($event)',
  },
})
export class EvaQualitySelector implements OnInit, OnDestroy {
  protected evaAPI = inject(EvaApi);

  /**
   * Label shown in the dropdown header.
   *
   * @default "Quality selector"
   */
  readonly evaQualitySelectorText = input<string>('Quality selector');

  /**
   * Label used for the Auto (ABR) quality option.
   *
   * @default "Auto"
   */
  readonly evaQualityAutoText = input<string>('Auto');

  /**
   * ARIA label for the quality selector button.
   */
  readonly evaAria = input<EvaQualityAria>({ ariaLabel: 'Quality selector' });

  /** Resolves the `aria-label` from the aria input. */
  protected ariaLabel = computed<string>(() => {
    return this.evaAria()?.ariaLabel ?? 'Quality selector';
  });

  /** Whether the dropdown is currently open. */
  protected isOpen = signal(false);

  /** The list of available quality levels, sourced from `EvaApi.qualityLevelsSubject`. */
  protected qualities = signal<EvaQualityLevel[]>([]);

  /**
   * The currently selected quality level.
   * Initialized to the Auto option when levels are first received.
   * Kept in sync with `EvaApi.currentQualityIndex`.
   */
  protected currentQuality = signal<EvaQualityLevel | null>(null);

  /** Index used for keyboard navigation within the quality list. */
  private keyboardIndex = signal(0);

  /** Subscription to quality level changes from `EvaApi`. Cleaned up in `ngOnDestroy`. */
  private qualityLevelsSub: Subscription | null = null;

  /** Bound reference to the click-outside handler for cleanup in `ngOnDestroy`. */
  private clickOutsideListener?: (event: MouseEvent) => void;

  /**
   * Subscribes to `EvaApi.qualityLevelsSubject` to keep the dropdown in sync
   * with quality levels registered by the active streaming directive.
   * Attaches a document-level click listener to close on outside clicks.
   */
  ngOnInit(): void {
    this.qualityLevelsSub = this.evaAPI.qualityLevelsSubject.subscribe(levels => {
      this.qualities.set(levels);

      // Default to Auto option when levels first arrive
      const auto = levels.find(q => q.isAuto) ?? levels[0] ?? null;
      this.currentQuality.set(auto);
      this.keyboardIndex.set(0);
    });

    this.clickOutsideListener = this.handleClickOutside.bind(this);
    document.addEventListener('click', this.clickOutsideListener, true);
  }

  /** Unsubscribes and removes the document-level click listener. */
  ngOnDestroy(): void {
    this.qualityLevelsSub?.unsubscribe();
    if (this.clickOutsideListener) {
      document.removeEventListener('click', this.clickOutsideListener, true);
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
  protected selectQuality(quality: EvaQualityLevel, index: number): void {
    this.currentQuality.set(quality);
    this.keyboardIndex.set(index);
    this.isOpen.set(false);
    this.evaAPI.controlsSelectorComponentActive.next(false);
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
    const isOpen = this.isOpen();
    const currentIndex = this.keyboardIndex();

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.toggleDropdown();
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          this.isOpen.set(true);
          this.evaAPI.controlsSelectorComponentActive.next(true);
        } else {
          const next = Math.min(currentIndex + 1, qualities.length - 1);
          this.selectQuality(qualities[next], next);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          this.isOpen.set(true);
          this.evaAPI.controlsSelectorComponentActive.next(true);
        } else {
          const prev = Math.max(currentIndex - 1, 0);
          this.selectQuality(qualities[prev], prev);
        }
        break;

      case 'Home':
        if (isOpen) {
          e.preventDefault();
          this.selectQuality(qualities[0], 0);
        }
        break;

      case 'End':
        if (isOpen) {
          e.preventDefault();
          const last = qualities.length - 1;
          this.selectQuality(qualities[last], last);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.isOpen.set(false);
        this.evaAPI.controlsSelectorComponentActive.next(false);
        break;
    }
  }

  /** Closes the dropdown when focus moves outside the `eva-quality-selector` element. */
  protected onBlur(event: FocusEvent): void {
    const related = event.relatedTarget as HTMLElement;
    if (!related || !related.closest('eva-quality-selector')) {
      this.isOpen.set(false);
      this.evaAPI.controlsSelectorComponentActive.next(false);
    }
  }

  private toggleDropdown(): void {
    this.isOpen.update(open => !open);
    this.evaAPI.controlsSelectorComponentActive.next(this.isOpen());
  }

  private handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('eva-quality-selector')) {
      this.isOpen.set(false);
      this.evaAPI.controlsSelectorComponentActive.next(false);
    }
  }
}