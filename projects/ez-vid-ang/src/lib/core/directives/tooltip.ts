import { Directive, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaKeyboardShortcutsConfiguration } from '../../types';

const KEY_DISPLAY_MAP: Record<string, string> = {
  ARROWLEFT: '←',
  ARROWRIGHT: '→',
  ARROWUP: '↑',
  ARROWDOWN: '↓',
  SPACE: 'Space',
};

function formatTooltipKey(key: string): string {
  return KEY_DISPLAY_MAP[key.toUpperCase()] ?? key;
}

/**
 * Valid property keys of `EvaKeyboardShortcutsConfiguration` that hold a key-binding string.
 * Pass one of these to `evaTooltipShortcutKey` to display the corresponding key next to the tooltip label.
 */
export type EvaTooltipShortcutKey = keyof Omit<Required<EvaKeyboardShortcutsConfiguration>, 'backwardSeconds' | 'forwardSeconds'>;

/**
 * Tooltip directive for Eva player control components.
 *
 * Apply directly to a supported Eva control element in the template. Shows a floating
 * tooltip on `mouseenter` and `focus`. The tooltip hides on `mouseleave`, `blur`, and destroy.
 *
 * Positioned with `position: fixed` using `getBoundingClientRect()`, clamped to stay within
 * the bounds of the parent `<eva-player>` (falling back to the viewport if there is none) —
 * it never spills outside the player, even for buttons near the edge of the controls bar.
 *
 * **Supported elements:** `eva-play-pause`, `eva-backward`, `eva-forward`, `eva-loop`,
 * `eva-picture-in-picture`, `eva-active-chapter`, `eva-mute`, `eva-volume`,
 * `eva-cinema-mode`, `eva-download`, `eva-screenshot`, `eva-track-selector`,
 * `eva-playback-speed`, `eva-quality-selector`, `eva-settings-panel`, `eva-fullscreen`.
 *
 * **Label resolution order:**
 * 1. `evaTooltip` input — explicit override.
 * 2. Host element's `aria-label` attribute — used automatically when `evaTooltip` is not set.
 * 3. Nothing — tooltip is not shown.
 *
 * **Keyboard shortcut badge:** pass `evaTooltipShortcutKey` with a property name from
 * `EvaKeyboardShortcutsConfiguration` (e.g. `'playPause'`, `'muteKey'`, `'fullscreen'`).
 * The badge is only shown when keyboard shortcuts are enabled on the player — if
 * `EvaApi.keyboardShortcutsConfigSubject` is `null`, the badge is suppressed automatically.
 *
 * @example
 * // Tooltip with shortcut badge — label read from aria-label automatically
 * <eva-play-pause evaTooltip evaTooltipShortcutKey="playPause" />
 *
 * @example
 * // Explicit label override
 * <eva-play-pause evaTooltip="Play / Pause" evaTooltipShortcutKey="playPause" />
 *
 * @example
 * // No shortcut badge
 * <eva-fullscreen evaTooltip />
 */
@Directive({
  selector: 'eva-play-pause[evaTooltip], eva-backward[evaTooltip], eva-forward[evaTooltip], eva-loop[evaTooltip], eva-picture-in-picture[evaTooltip], eva-active-chapter[evaTooltip], eva-mute[evaTooltip], eva-volume[evaTooltip], eva-cinema-mode[evaTooltip], eva-download[evaTooltip], eva-screenshot[evaTooltip], eva-track-selector[evaTooltip], eva-playback-speed[evaTooltip], eva-quality-selector[evaTooltip], eva-settings-panel[evaTooltip], eva-fullscreen[evaTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focus)': 'show()',
    '(blur)': 'hide()',
  },
})
export class EvaTooltip implements OnInit, OnDestroy {
  private readonly evaAPI = inject(EvaApi);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Cached reference to the parent `<eva-player>` element, used to keep the tooltip within its bounds. */
  private playerEl: HTMLElement | null = null;

  /**
   * Tooltip label text. When omitted, the host element's `aria-label` attribute is used as fallback.
   * Set explicitly when you want tooltip text that differs from the aria label.
   *
   * @default '' (falls back to host aria-label)
   */
  public readonly evaTooltip = input<string>('');

  /**
   * Property name in `EvaKeyboardShortcutsConfiguration` whose bound key will be displayed
   * as a shortcut badge next to the label. The badge is suppressed automatically when
   * keyboard shortcuts are not enabled on the player.
   *
   * @example 'playPause'  // shows "Space"
   * @example 'muteKey'    // shows "M"
   * @example 'fullscreen' // shows "F"
   */
  public readonly evaTooltipShortcutKey = input<EvaTooltipShortcutKey | ''>('');

  private tooltipEl: HTMLElement | null = null;

  public ngOnInit(): void {
    this.playerEl = this.el.nativeElement.closest('eva-player');
  }

  protected show(): void {
    if (typeof document === 'undefined') { return; }

    const label = this.evaTooltip() || this.el.nativeElement.getAttribute('aria-label') || '';
    if (!label) { return; }

    this.hide();

    const tooltip = document.createElement('div');
    tooltip.className = 'eva-tooltip-popup';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.style.visibility = 'hidden';

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    tooltip.appendChild(labelSpan);

    const shortcutKey = this.evaTooltipShortcutKey();
    if (shortcutKey) {
      const config = this.evaAPI.keyboardShortcutsConfigSubject.getValue();
      const rawKey = config ? (config as Record<string, unknown>)[shortcutKey] : null;
      if (typeof rawKey === 'string') {
        const kbd = document.createElement('kbd');
        kbd.className = 'eva-tooltip-kbd';
        kbd.textContent = formatTooltipKey(rawKey);
        tooltip.appendChild(kbd);
      }
    }

    document.body.appendChild(tooltip);
    this.tooltipEl = tooltip;

    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const GAP = 8;
    const EDGE = 4;
    const HALF = 2;

    // Clamp to the player bounds (falling back to the viewport when there is
    // No <eva-player> ancestor) so the tooltip never spills outside the
    // Player — e.g. for buttons near the edge of the controls bar.
    const boundsRect = this.playerEl?.getBoundingClientRect() ?? null;
    const minTop = (boundsRect?.top ?? 0) + EDGE;
    const maxTop = (boundsRect?.bottom ?? window.innerHeight) - tooltipRect.height - EDGE;
    const minLeft = (boundsRect?.left ?? 0) + EDGE;
    const maxLeft = (boundsRect?.right ?? window.innerWidth) - tooltipRect.width - EDGE;

    let top = hostRect.top - tooltipRect.height - GAP;
    if (top < minTop) { top = hostRect.bottom + GAP; }
    top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop));

    let left = hostRect.left + hostRect.width / HALF - tooltipRect.width / HALF;
    left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft));

    tooltip.style.visibility = '';
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    requestAnimationFrame(() => {
      this.tooltipEl?.classList.add('eva-tooltip-visible');
    });
  }

  protected hide(): void {
    this.tooltipEl?.remove();
    this.tooltipEl = null;
  }

  public ngOnDestroy(): void {
    this.hide();
  }
}
