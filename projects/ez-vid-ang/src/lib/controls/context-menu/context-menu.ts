import { ChangeDetectionStrategy, Component, ElementRef, inject, input, OnInit, output, signal, viewChild } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaContextMenuEvent, EvaContextMenuItem } from '../../types';

/**
 * Custom context menu component for the Eva video player.
 *
 * Replaces the browser's default right-click menu on the player with a
 * branded dropdown. Positioned at the cursor location and clamped within
 * the player boundaries so it never overflows. Displayed above all other
 * player UI (`z-index: 1200`), including the overlay play button.
 *
 * Menu items are provided via the `evaMenuItems` input. When an item is
 * clicked, the component emits `evaMenuItemClicked` with the item's `id`,
 * `label`, and current video state. The consumer handles the action.
 *
 * Items with `divider: true` render as a visual separator line.
 * Items with `disabled: true` are visible but not clickable.
 *
 * Must be placed inside `<eva-player>`. The component validates this on
 * init and logs a warning if the parent player is not found.
 *
 * The menu element stays in the DOM at all times and is shown/hidden via
 * a CSS class toggle (`eva-context-menu-open`), enabling smooth scale and
 * opacity transitions on open and close.
 *
 * Position clamping uses `offsetWidth`/`offsetHeight` (unaffected by CSS
 * transforms) to measure the menu after the first animation frame, then
 * adjusts `left`/`top` so the menu stays fully within the player.
 *
 * Closes on:
 * - Click on a menu item
 * - Click outside the menu
 * - `Escape` key
 * - A second right-click while the menu is open
 *
 * @example
 * <eva-context-menu
 *   [evaMenuItems]="[
 *     { id: 'copy-url', label: 'Copy video URL' },
 *     { id: 'divider', label: '', divider: true },
 *     { id: 'stats', label: 'Stats for nerds' }
 *   ]"
 *   (evaMenuItemClicked)="onMenuAction($event)"
 * />
 */
@Component({
  selector: 'eva-context-menu',
  templateUrl: './context-menu.html',
  styleUrl: './context-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "(document:contextmenu)": "onContextMenu($event)",
    "(document:click)": "onDocumentClick($event)",
    "(document:keydown.escape)": "close()",
  }
})
export class EvaContextMenu implements OnInit {
  private readonly evaAPI = inject(EvaApi);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Cached reference to the parent `eva-player` host element. Resolved once in `ngOnInit`. */
  private playerEl: HTMLElement | null = null;

  /**
   * The list of menu items to display.
   *
   * **Required.** Items with `divider: true` render as separator lines.
   * Items with `disabled: true` are visible but not clickable.
   */
  public readonly evaMenuItems = input.required<EvaContextMenuItem[]>();

  /**
   * Emitted when a non-disabled, non-divider menu item is clicked or
   * activated via keyboard. Contains the item's `id` and `label`, plus
   * the current video source URL and playback time.
   */
  public readonly evaMenuItemClicked = output<EvaContextMenuEvent>();

  /** Reference to the `.eva-context-menu` container, used for position clamping after open. */
  protected readonly menuRef = viewChild<ElementRef<HTMLElement>>('menuContainer');

  /** Whether the context menu is currently visible. Drives the `eva-context-menu-open` CSS class. */
  protected readonly isOpen = signal(false);

  /** Horizontal position of the menu in pixels, relative to the player's left edge. */
  protected readonly menuLeft = signal(0);

  /** Vertical position of the menu in pixels, relative to the player's top edge. */
  protected readonly menuTop = signal(0);

  /** Index of the currently focused actionable item for keyboard navigation. `-1` when no item is focused. */
  protected readonly focusedIndex = signal(-1);

  /**
   * Resolves and caches the parent `eva-player` element.
   * Logs a warning if the component is not inside an `<eva-player>`.
   */
  public ngOnInit(): void {
    this.playerEl = this.el.nativeElement.closest('eva-player');
    if (!this.playerEl) {
      console.warn('EvaContextMenu must be placed inside <eva-player>.');
    }
  }

  /**
   * Handles the `contextmenu` event on the document.
   * Only acts if the right-click target is inside this component's parent player.
   * Prevents the browser's default context menu and positions the custom menu
   * at the cursor location, then clamps it within the player bounds after one frame.
   */
  protected onContextMenu(e: MouseEvent): void {
    if (!this.playerEl) { return; }
    if (!(e.target instanceof Node) || !this.playerEl.contains(e.target)) { return; }

    e.preventDefault();

    if (this.isOpen()) {
      this.close();
      return;
    }

    const rect = this.playerEl.getBoundingClientRect();
    this.menuLeft.set(e.clientX - rect.left);
    this.menuTop.set(e.clientY - rect.top);
    this.focusedIndex.set(-1);
    this.isOpen.set(true);

    requestAnimationFrame(() => {
      this.clampPosition(rect);
    });
  }

  /**
   * Adjusts `menuLeft` and `menuTop` so the menu stays fully within the player.
   * Uses `offsetWidth`/`offsetHeight` which are unaffected by the CSS `scale()` transition.
   */
  private clampPosition(playerRect: DOMRect): void {
    const menuEl = this.menuRef()?.nativeElement;
    if (!menuEl) { return; }

    const menuWidth = menuEl.offsetWidth;
    const menuHeight = menuEl.offsetHeight;
    const playerWidth = playerRect.width;
    const playerHeight = playerRect.height;
    let left = this.menuLeft();
    let top = this.menuTop();

    if (left + menuWidth > playerWidth) {
      left = playerWidth - menuWidth;
    }
    if (top + menuHeight > playerHeight) {
      top = playerHeight - menuHeight;
    }
    if (left < 0) { left = 0; }
    if (top < 0) { top = 0; }

    this.menuLeft.set(left);
    this.menuTop.set(top);
  }

  /** Closes the menu when clicking outside of it. */
  protected onDocumentClick(e: MouseEvent): void {
    if (!this.isOpen()) { return; }
    if (!(e.target instanceof Node) || !this.el.nativeElement.contains(e.target)) {
      this.close();
    }
  }

  /**
   * Handles keyboard navigation within the open menu.
   * `ArrowDown`/`ArrowUp` cycle through actionable items (skipping dividers and disabled).
   * `Enter` selects the focused item.
   */
  protected onKeyDown(e: KeyboardEvent): void {
    if (!this.isOpen()) { return; }

    const items = this.evaMenuItems().filter(item => !item.divider && !item.disabled);
    const currentIndex = this.focusedIndex();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.focusedIndex.set(currentIndex < items.length - 1 ? currentIndex + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.focusedIndex.set(currentIndex > 0 ? currentIndex - 1 : items.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (currentIndex >= 0 && currentIndex < items.length) {
          this.selectItem(items[currentIndex]);
        }
        break;
      default:
        break;
    }
  }

  /** Emits `evaMenuItemClicked` with the item data and current video state, then closes the menu. */
  protected selectItem(item: EvaContextMenuItem): void {
    if (item.divider || item.disabled) { return; }

    const video = this.evaAPI.assignedVideoElement;
    this.evaMenuItemClicked.emit({
      itemId: item.id,
      label: item.label,
      currentSrc: video?.currentSrc ?? '',
      currentTime: video?.currentTime ?? 0,
    });

    this.close();
  }

  /** Hides the menu and resets keyboard focus. */
  protected close(): void {
    this.isOpen.set(false);
    this.focusedIndex.set(-1);
  }

  /** Returns the index of the given item among actionable (non-divider, non-disabled) items. Used for keyboard focus tracking. */
  protected getActionableIndex(item: EvaContextMenuItem): number {
    return this.evaMenuItems().filter(i => !i.divider && !i.disabled).indexOf(item);
  }
}
