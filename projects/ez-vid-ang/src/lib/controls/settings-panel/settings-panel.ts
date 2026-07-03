import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { CLICK_OUTSIDE_DEBOUNCE_MS, HEIGHT_TRANSITION_FALLBACK_MS } from '../../constants';
import { EvaIcon } from '../../core/icon/icon';
import { EvaSettingsMenuEvent, EvaSettingsMenuItem, EvaSettingsMenuOption } from '../../types';
import { EvaSettingsPanelAria, EvaSettingsPanelAriaTransformed, transformEvaSettingsPanelAria } from '../../utils/aria-utilities';

/**
 * YouTube-style settings panel component for the Eva video player.
 *
 * Renders as a button in the control bar using the `settings` icon from the Eva
 * icon registry. When clicked, a panel opens above the button showing the main menu.
 * Items with `options` navigate into a sub-menu with a back button; items without
 * `options` emit a click event directly.
 *
 * The panel closes when:
 * - Focus moves outside the component (`blur`)
 * - A click is detected outside the component
 * - `Escape` is pressed
 *
 * Keyboard support:
 * - `Enter` / `Space` — toggle the panel or select an item
 * - `ArrowUp` / `ArrowDown` — navigate menu items
 * - `Escape` — close sub-menu (back to main) or close the panel
 *
 * Register the icon with `addEvaIcons` before using the component. Use `evaCustomIcon`
 * to suppress the registry icon and project your own gear icon instead.
 *
 * @example
 * // Register icon once (e.g. in main.ts or app config)
 * import { addEvaIcons } from 'ez-vid-ang';
 * import { evaSettingsIcon } from 'ez-vid-ang/icons';
 * addEvaIcons({ evaSettingsIcon });
 *
 * @example
 * <eva-settings-panel
 *   [evaSettingsMenuItems]="[
 *     { id: 'speed', label: 'Playback speed', currentValue: 'Normal', options: [
 *       { id: '0.5', label: '0.5x' },
 *       { id: '1', label: 'Normal', selected: true },
 *       { id: '1.5', label: '1.5x' },
 *       { id: '2', label: '2x' }
 *     ]},
 *     { id: 'quality', label: 'Quality', currentValue: 'Auto' }
 *   ]"
 *   (evaSettingsMenuItemSelected)="onSettingChanged($event)"
 * />
 *
 * @example
 * // Custom icon
 * <eva-settings-panel [evaCustomIcon]="true" [evaSettingsMenuItems]="items">
 *   <img src="my-settings-icon.svg" alt="" />
 * </eva-settings-panel>
 */
@Component({
  selector: 'eva-settings-panel',
  imports: [EvaIcon],
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'tabindex': '0',
    'role': 'button',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-expanded]': 'isOpen()',
    '[class.open]': 'isOpen()',
    '(click)': 'onHostClick($event)',
    '(keydown)': 'onHostKeyDown($event)',
    '(blur)': 'onBlur($event)',
  }
})
export class EvaSettingsPanel implements OnInit, OnDestroy, AfterViewInit {

  private readonly evaAPI = inject(EvaApi);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Reference to the panel content wrapper, used for height animation. */
  private readonly contentEl = viewChild<ElementRef<HTMLElement>>('panelContent');

  /** Reference to the dropdown wrapper, used for position clamping. */
  private readonly dropdownEl = viewChild<ElementRef<HTMLElement>>('dropdown');

  /** Cached parent `eva-player` element, resolved once on init. */
  private playerElement: HTMLElement | null = null;

  /**
   * When `true`, suppresses the built-in gear icon so you can provide
   * your own icon via content projection.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  /**
   * The list of settings menu items displayed in the main menu.
   *
   * **Required.** Each item can have an optional `options` array for sub-menu navigation.
   */
  public readonly evaSettingsMenuItems = input.required<EvaSettingsMenuItem[]>();

  /**
   * Title displayed in the panel header.
   *
   * @default "Settings"
   */
  public readonly evaSettingsPanelTitle = input<string>('Settings');

  /**
   * Text for the back button in sub-menus.
   *
   * @default "Back"
   */
  public readonly evaSettingsBackText = input<string>('Back');

  /**
   * ARIA configuration for the settings button.
   */
  public readonly evaAria = input<EvaSettingsPanelAriaTransformed, EvaSettingsPanelAria>(
    transformEvaSettingsPanelAria(undefined),
    { transform: transformEvaSettingsPanelAria },
  );

  /** Emitted when a menu option is selected (either from sub-menu or a direct-action item). */
  public readonly evaSettingsMenuItemSelected = output<EvaSettingsMenuEvent>();

  /** Resolves the `aria-label` from the transformed aria input. */
  protected readonly ariaLabel = computed<string>(() => this.evaAria().ariaLabel);

  /** Whether the settings panel is currently open. */
  protected readonly isOpen = signal(false);

  /** The currently active sub-menu item, or `null` when showing the main menu. */
  protected readonly activeSubMenu = signal<EvaSettingsMenuItem | null>(null);

  /** Index of the focused item in the current menu view (main or sub-menu). */
  protected readonly focusedIndex = signal(0);

  /** Timestamp when the panel was last opened. Used to ignore the same click event that triggered the open. */
  private openedAt = 0;

  /** Bound reference to the click-outside handler for cleanup in `ngOnDestroy`. */
  private clickOutsideListener?: (event: MouseEvent) => void;

  /** The items currently displayed — either main menu or sub-menu options mapped to the same shape. */
  protected readonly visibleItems = computed(() => {
    const sub = this.activeSubMenu();
    if (sub?.options) {
      return sub.options;
    }
    return this.evaSettingsMenuItems();
  });

  /** Whether we're currently in a sub-menu view. */
  protected readonly isInSubMenu = computed(() => this.activeSubMenu() !== null);

  /** Caches the parent player element and attaches the document-level click-outside listener. */
  public ngOnInit(): void {
    this.playerElement = this.el.nativeElement.closest('eva-player');
    this.clickOutsideListener = this.handleClickOutside.bind(this);
    document.addEventListener('click', this.clickOutsideListener, true);
  }

  /** Takes an initial height snapshot for the content element. */
  public ngAfterViewInit(): void {
    this.snapshotHeight();
  }

  /** Removes the document-level click-outside listener. */
  public ngOnDestroy(): void {
    if (this.clickOutsideListener) {
      document.removeEventListener('click', this.clickOutsideListener, true);
    }
  }

  /** Toggles the panel when the host element itself is clicked (not propagated from panel content). */
  protected onHostClick(event: MouseEvent): void {
    if (event.target instanceof HTMLElement && event.target.closest('.eva-settings-panel-dropdown')) {
      return;
    }
    this.togglePanel();
  }

  /** Handles keyboard navigation: Enter/Space toggle, Arrow keys navigate, Escape closes, Home/End jump. */
  protected onHostKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.isOpen()) {
          this.togglePanel();
        }
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.togglePanel();
        } else {
          this.moveFocus(1);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (!this.isOpen()) {
          this.togglePanel();
        } else {
          this.moveFocus(-1);
        }
        break;

      case 'Escape':
        event.preventDefault();
        if (this.activeSubMenu()) {
          this.goBack();
        } else {
          this.closePanel();
        }
        break;

      case 'Home':
        if (this.isOpen()) {
          event.preventDefault();
          this.focusedIndex.set(0);
        }
        break;

      case 'End':
        if (this.isOpen() && this.visibleItems().length > 0) {
          event.preventDefault();
          this.focusedIndex.set(this.visibleItems().length - 1);
        }
        break;

      default:
        break;
    }
  }

  /** Closes the panel when focus moves outside the component. */
  protected onBlur(event: FocusEvent): void {
    const relatedTarget = event.relatedTarget;
    if (!(relatedTarget instanceof HTMLElement) || !relatedTarget.closest('eva-settings-panel')) {
      this.closePanel();
    }
  }

  /** Handles clicking a main menu item. */
  protected onMainItemClick(item: EvaSettingsMenuItem): void {
    if (item.disabled) { return; }

    if (item.options?.length) {
      this.animateHeightTransition(() => {
        this.activeSubMenu.set(item);
        this.focusedIndex.set(0);
      });
    } else {
      this.evaSettingsMenuItemSelected.emit({
        itemId: item.id,
        optionId: item.id,
        label: item.label,
      });
      this.closePanel();
    }
  }

  /** Handles clicking a sub-menu option. Emits the event and returns to the main menu. */
  protected onOptionClick(option: EvaSettingsMenuOption): void {
    const parent = this.activeSubMenu();
    if (!parent) { return; }

    this.evaSettingsMenuItemSelected.emit({
      itemId: parent.id,
      optionId: option.id,
      label: option.label,
    });
    this.goBack();
  }

  /** Keyboard handler for main menu items. */
  protected onMainItemKeyDown(event: KeyboardEvent, item: EvaSettingsMenuItem): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.onMainItemClick(item);
    }
  }

  /** Keyboard handler for sub-menu options. */
  protected onOptionKeyDown(event: KeyboardEvent, option: EvaSettingsMenuOption): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.onOptionClick(option);
    }
  }

  /** Navigates back to the main menu from a sub-menu. */
  protected goBack(): void {
    this.animateHeightTransition(() => {
      this.activeSubMenu.set(null);
      this.focusedIndex.set(0);
    });
  }

  /** Returns whether the given main menu item index matches the focused index. */
  protected isMainItemFocused(index: number): boolean {
    return !this.isInSubMenu() && this.focusedIndex() === index;
  }

  /** Returns whether the given sub-menu option index matches the focused index. */
  protected isOptionFocused(index: number): boolean {
    return this.isInSubMenu() && this.focusedIndex() === index;
  }

  /** Toggles the panel open/closed. Resets sub-menu and focus on open, clamps position after first frame. */
  private togglePanel(): void {
    const wasOpen = this.isOpen();
    this.isOpen.set(!wasOpen);
    this.evaAPI.controlsSelectorComponentActive.next(!wasOpen);

    if (!wasOpen) {
      this.openedAt = Date.now();
      this.activeSubMenu.set(null);
      this.focusedIndex.set(0);
      this.resetDropdownPosition();
      requestAnimationFrame(() => {
        this.clampDropdownPosition();
      });
    }
  }

  /** Closes the panel, resets sub-menu and focus, and notifies `controlsSelectorComponentActive`. */
  private closePanel(): void {
    this.isOpen.set(false);
    this.activeSubMenu.set(null);
    this.focusedIndex.set(0);
    this.evaAPI.controlsSelectorComponentActive.next(false);
  }

  /** Moves the focused index by `direction` (+1 or -1), clamped to the visible items range. */
  private moveFocus(direction: number): void {
    const items = this.visibleItems();
    const current = this.focusedIndex();
    const next = current + direction;

    if (next >= 0 && next < items.length) {
      this.focusedIndex.set(next);
    }
  }

  /** Closes the panel when a click is detected outside the host element. Debounced to ignore the opening click. */
  private handleClickOutside(event: MouseEvent): void {
    if (!this.isOpen()) { return; }
    if (Date.now() - this.openedAt < CLICK_OUTSIDE_DEBOUNCE_MS) { return; }

    if (!(event.target instanceof Node) || !this.el.nativeElement.contains(event.target)) {
      this.closePanel();
    }
  }

  /** Sets the content element's height to its current `scrollHeight` for transition readiness. */
  private snapshotHeight(): void {
    const el = this.contentEl()?.nativeElement;
    if (el) {
      el.style.height = `${el.scrollHeight}px`;
    }
  }

  /** Measures the dropdown against the player bounds and shifts it inward if it overflows. */
  private clampDropdownPosition(): void {
    const dropdown = this.dropdownEl()?.nativeElement;
    if (!dropdown || !this.playerElement) { return; }

    const playerRect = this.playerElement.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();

    if (dropdownRect.left < playerRect.left) {
      dropdown.style.right = 'auto';
      dropdown.style.left = '0px';
    }

    if (dropdownRect.right > playerRect.right) {
      dropdown.style.left = 'auto';
      dropdown.style.right = '0px';
    }

    if (dropdownRect.top < playerRect.top) {
      dropdown.style.bottom = 'auto';
      dropdown.style.top = '0px';
    }
  }

  /** Clears inline position styles so the next open starts from default CSS positioning. */
  private resetDropdownPosition(): void {
    const dropdown = this.dropdownEl()?.nativeElement;
    if (!dropdown) { return; }
    dropdown.style.left = '';
    dropdown.style.right = '';
    dropdown.style.bottom = '';
    dropdown.style.top = '';
  }

  /** Animates the content height from current to new value using a double-rAF FLIP pattern with a timeout fallback. */
  private animateHeightTransition(changeFn: () => void): void {
    const el = this.contentEl()?.nativeElement;
    if (!el) {
      changeFn();
      return;
    }

    const startHeight = el.offsetHeight;

    el.style.height = 'auto';
    changeFn();

    requestAnimationFrame(() => {
      const endHeight = el.scrollHeight;
      el.style.height = `${startHeight}px`;

      requestAnimationFrame(() => {
        el.style.height = `${endHeight}px`;

        const resetHeight = (): void => {
          el.removeEventListener('transitionend', resetHeight);
          el.style.height = 'auto';
        };
        el.addEventListener('transitionend', resetHeight, { once: true });
        setTimeout(resetHeight, HEIGHT_TRANSITION_FALLBACK_MS);
      });
    });
  }
}
