import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, effect, inject, input } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaKeyboardShortcutsConfiguration } from '../../types';
import { EvaFullscreenAPI } from '../../api/fullscreen';
import { SEEK_ICON_THRESHOLD_30 } from '../../constants';

const FRAME_DURATION_SECONDS = 1 / SEEK_ICON_THRESHOLD_30;



const INTERACTIVE_ROLES = new Set([
  'listbox', 'combobox', 'menu', 'menuitem', 'slider',
  'spinbutton', 'textbox', 'searchbox', 'gridcell',
]);

/** Tracks which player was last interacted with for multi-player scoping. */
let lastActiveApi: EvaApi | null = null;

/**
 * Directive that enables configurable keyboard shortcuts on the video player.
 *
 * Listens on the `document` for `keydown` events and delegates to `EvaApi`
 * and `EvaFullscreenAPI` methods. The listener is dynamically added/removed
 * via an `effect()` based on `evaKeyboardShortcutsEnabled`.
 *
 * Applied as a template directive on the `<video>` element inside `EvaPlayer` —
 * consumers configure it via inputs on `<eva-player>` directly.
 *
 * Shortcuts are suppressed when focus is inside an `<input>`, `<textarea>`,
 * `<select>`, `contenteditable` element, or an element with an interactive
 * ARIA role (e.g. `listbox`, `combobox`, `slider`).
 *
 * In multi-player setups, only the last-interacted player responds to shortcuts.
 *
 * @example
 * <eva-player
 *   [evaKeyboardShortcutsEnabled]="true"
 *   [evaKeyboardShortcutsConfiguration]="{ backwardsKeyOne: 'ArrowLeft', forwardKeyOne: 'ArrowRight' }"
 * />
 */
@Directive({
  selector: '[evaKeyboardShortcuts]',
})
export class EvaKeyboardShortcuts {
  /** Whether keyboard shortcuts are active. Dynamically adds/removes the document listener. */
  public readonly evaKeyboardShortcutsEnabled = input.required<boolean>();

  /** Key binding configuration. All keys are pre-normalized to uppercase via the transform on `EvaPlayer`. */
  public readonly evaKeyboardShortcutsConfiguration = input.required<Required<EvaKeyboardShortcutsConfiguration>>();

  private readonly api = inject(EvaApi);
  private readonly fullscreenService = inject(EvaFullscreenAPI);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  public constructor() {
    effect(() => {
      if (this.evaKeyboardShortcutsEnabled()) {
        if (!lastActiveApi) { lastActiveApi = this.api; }
        this.document.removeEventListener('keydown', this.onKeydown);
        this.document.addEventListener('keydown', this.onKeydown);
      } else {
        this.document.removeEventListener('keydown', this.onKeydown);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('keydown', this.onKeydown);
      if (lastActiveApi === this.api) { lastActiveApi = null; }
    });
  }

  /**
   * Handles `keydown` events. Matches `e.key` (case-insensitive) against the
   * pre-normalized config. `playPause` uses `e.code` to reliably detect Space.
   * Number keys `0`–`9` jump to the corresponding percentage of total duration.
   *
   * In multi-player setups, only the player whose container contains the focused
   * element responds. If focus is outside all players, the last-interacted player handles it.
   */
  private readonly onKeydown = (e: KeyboardEvent): void => {
    if (!(e.target instanceof HTMLElement)) { return; }
    const target = e.target;

    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) {
      return;
    }
    const role = target.getAttribute('role');
    if (role && INTERACTIVE_ROLES.has(role)) {
      return;
    }

    if (lastActiveApi && !lastActiveApi.isPlayerReady) {
      lastActiveApi = null;
    }

    const videoEl = this.api.assignedVideoElement;
    if (videoEl) {
      const thisPlayer = videoEl.closest('eva-player');
      const targetPlayer = target.closest('eva-player');
      if (targetPlayer) {
        if (targetPlayer !== thisPlayer) { return; }
        lastActiveApi = this.api;
      } else if (lastActiveApi && lastActiveApi !== this.api) { return; }
    }

    const config = this.evaKeyboardShortcutsConfiguration();
    const key = e.key.toUpperCase();
    const code = e.code.toUpperCase();

    if (config.backwardsKeyOne && key === config.backwardsKeyOne) {
      e.preventDefault();
      this.api.seekBack(config.backwardSeconds);
    } else if (config.forwardKeyOne && key === config.forwardKeyOne) {
      e.preventDefault();
      this.api.seekForward(config.forwardSeconds);
    } else if (config.backwardsKeyTwo && key === config.backwardsKeyTwo) {
      e.preventDefault();
      this.api.seekBack(config.backwardSeconds);
    } else if (config.forwardKeyTwo && key === config.forwardKeyTwo) {
      e.preventDefault();
      this.api.seekForward(config.forwardSeconds);
    } else if (config.fullscreen && key === config.fullscreen) {
      e.preventDefault();
      this.fullscreenService.toggleFullscreen();
    } else if (config.muteKey && key === config.muteKey) {
      e.preventDefault();
      this.api.muteOrUnmuteVideo();
    } else if (config.playPause && code === config.playPause) {
      e.preventDefault();
      this.api.playOrPauseVideo();
    } else if (config.oneFrameBackward && key === config.oneFrameBackward) {
      e.preventDefault();
      this.api.seekBack(FRAME_DURATION_SECONDS);
    } else if (config.oneFrameForward && key === config.oneFrameForward) {
      e.preventDefault();
      this.api.seekForward(FRAME_DURATION_SECONDS);
    } else if (key >= '0' && key <= '9') {
      e.preventDefault();
      this.api.jumpToVideoPercentage(key);
    }
  };
}
