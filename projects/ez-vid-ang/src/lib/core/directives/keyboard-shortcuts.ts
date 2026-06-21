import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, effect, inject, input } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaKeyboardShortcutsConfiguration } from '../../types';
import { EvaFullscreenAPI } from '../../api/fullscreen';

/** Duration of a single frame at 30fps, used for frame-step shortcuts. */
const FRAME_DURATION_SECONDS = 1 / 30;

/**
 * Directive that enables configurable keyboard shortcuts on the video player.
 *
 * Listens on the `document` for `keydown` events and delegates to `EvaApi`
 * and `EvaFullscreenAPI` methods. The listener is dynamically added/removed
 * via an `effect()` based on `evaKeyboardShortcutsEnabled`.
 *
 * Applied as a host directive on `EvaPlayer` — consumers configure it
 * via inputs on `<eva-player>` directly.
 *
 * Shortcuts are suppressed when focus is inside an `<input>`, `<textarea>`,
 * or `contenteditable` element to avoid interfering with text entry.
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

  /** Key binding configuration. All keys are guaranteed present via the transform on `EvaPlayer`. */
  public readonly evaKeyboardShortcutsConfiguration = input.required<Required<EvaKeyboardShortcutsConfiguration>>();

  private readonly api = inject(EvaApi);
  private readonly fullscreenService = inject(EvaFullscreenAPI);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      if (this.evaKeyboardShortcutsEnabled()) {
        this.document.addEventListener('keydown', this.onKeydown);
      } else {
        this.document.removeEventListener('keydown', this.onKeydown);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener('keydown', this.onKeydown);
    });
  }

  /**
   * Handles `keydown` events. Matches `e.key` (case-insensitive) against the
   * configured shortcuts. `playPause` uses `e.code` to reliably detect Space.
   * Number keys `0`–`9` jump to the corresponding percentage of total duration.
   */
  private readonly onKeydown = (e: KeyboardEvent): void => {
    const config = this.evaKeyboardShortcutsConfiguration();
    const key = e.key.toUpperCase();
    const code = e.code.toUpperCase();

    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    if (config.backwardsKeyOne && key === config.backwardsKeyOne.toUpperCase()) {
      e.preventDefault();
      this.api.seekBack(config.backwardSeconds);
    } else if (config.forwardKeyOne && key === config.forwardKeyOne.toUpperCase()) {
      e.preventDefault();
      this.api.seekForward(config.forwardSeconds);
    }
    else if (config.backwardsKeyTwo && key === config.backwardsKeyTwo.toUpperCase()) {
      e.preventDefault();
      this.api.seekBack(config.backwardSeconds);
    } else if (config.forwardKeyTwo && key === config.forwardKeyTwo.toUpperCase()) {
      e.preventDefault();
      this.api.seekForward(config.forwardSeconds);
    }
    else if (config.fullscreen && key === config.fullscreen.toUpperCase()) {
      e.preventDefault();
      this.fullscreenService.toggleFullscreen();
    }
    else if (config.muteKey && key === config.muteKey.toUpperCase()) {
      e.preventDefault();
      this.api.muteOrUnmuteVideo();
    }
    else if (config.playPause && code === config.playPause.toUpperCase()) {
      e.preventDefault();
      this.api.playOrPauseVideo();
    }
    else if (config.oneFrameBackward && key === config.oneFrameBackward.toUpperCase()) {
      e.preventDefault();
      this.api.seekBack(FRAME_DURATION_SECONDS);
    }
    else if (config.oneFrameForward && key === config.oneFrameForward.toUpperCase()) {
      e.preventDefault();
      this.api.seekForward(FRAME_DURATION_SECONDS);
    }
    else if (this.isNumberPressed(key)) {
      e.preventDefault();
      this.api.jumpToVideoPercentage(key);
    }
  };

  /** Returns `true` if the key is a digit `0`–`9`. */
  private isNumberPressed(key: string) {
    return key === "0" || key === "1" || key === "2" || key === "3" || key === "4" || key === "5" || key === "6" || key === "7" || key === "8" || key === "9";
  }
}
