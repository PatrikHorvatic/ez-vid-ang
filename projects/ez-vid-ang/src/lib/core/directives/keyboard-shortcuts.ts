import { DOCUMENT } from "@angular/common";
import { computed, DestroyRef, Directive, effect, inject, input } from "@angular/core";
import { EvaApi } from "../../api/eva-api";
import { EvaKeyboardShortcutsConfigurationTransformed } from "../../types";
import { EvaFullscreenAPI } from "../../api/fullscreen";
import { SEEK_ICON_THRESHOLD_30 } from "../../constants";

const FRAME_DURATION_SECONDS = 1 / SEEK_ICON_THRESHOLD_30;

const INTERACTIVE_ROLES = new Set(["listbox", "combobox", "menu", "menuitem", "slider", "spinbutton", "textbox", "searchbox", "gridcell"]);

/** A single key-to-action mapping, memoized via the `keyActions` computed and rebuilt only when the configuration changes. `key` is `undefined` when the shortcut is unbound (disabled). */
type KeyAction = {
  key: string | undefined;
  run: () => void;
};

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
  selector: "[evaKeyboardShortcuts]",
})
export class EvaKeyboardShortcuts {
  private readonly api = inject(EvaApi);
  private readonly fullscreenService = inject(EvaFullscreenAPI);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  /** Whether keyboard shortcuts are active. Dynamically adds/removes the document listener. */
  public readonly evaKeyboardShortcutsEnabled = input.required<boolean>();

  /**
   * Key binding configuration. All keys are pre-normalized to uppercase via the transform on `EvaPlayer`.
   * Unset keys are `undefined` — no shortcut has a default binding, so a shortcut is only
   * active once the consumer explicitly assigns it a key.
   */
  public readonly evaKeyboardShortcutsConfiguration = input.required<EvaKeyboardShortcutsConfigurationTransformed>();

  /**
   * The key-to-action lookup table, recomputed only when `evaKeyboardShortcutsConfiguration`
   * actually changes — not on every `keydown` — so runtime reconfiguration is picked up
   * automatically without rebuilding the table on every keystroke.
   */
  private readonly keyActions = computed<KeyAction[]>(() => this.buildKeyActions(this.evaKeyboardShortcutsConfiguration()));

  public constructor() {
    effect(() => {
      if (this.evaKeyboardShortcutsEnabled()) {
        if (!lastActiveApi) {
          lastActiveApi = this.api;
        }
        this.api.keyboardShortcutsConfigSubject.next(this.evaKeyboardShortcutsConfiguration());
        this.document.removeEventListener("keydown", this.onKeydown);
        this.document.addEventListener("keydown", this.onKeydown);
      } else {
        this.document.removeEventListener("keydown", this.onKeydown);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.document.removeEventListener("keydown", this.onKeydown);
      if (lastActiveApi === this.api) {
        lastActiveApi = null;
      }
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
    if (!(e.target instanceof HTMLElement)) {
      return;
    }
    const target = e.target;

    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable) {
      return;
    }
    const role = target.getAttribute("role");
    if (role && INTERACTIVE_ROLES.has(role)) {
      return;
    }

    if (lastActiveApi && !lastActiveApi.isPlayerReady) {
      lastActiveApi = null;
    }

    const videoEl = this.api.assignedVideoElement;
    if (videoEl) {
      const thisPlayer = videoEl.closest("eva-player");
      const targetPlayer = target.closest("eva-player");
      if (targetPlayer) {
        if (targetPlayer !== thisPlayer) {
          return;
        }
        lastActiveApi = this.api;
      } else if (lastActiveApi && lastActiveApi !== this.api) {
        return;
      }
    }

    const config = this.evaKeyboardShortcutsConfiguration();
    const key = e.key.toUpperCase();
    const code = e.code.toUpperCase();

    if (config.playPause && code === config.playPause) {
      e.preventDefault();
      this.api.playOrPauseVideo();
      return;
    }

    const match = this.keyActions().find((a) => a.key !== undefined && a.key === key);
    if (match) {
      e.preventDefault();
      match.run();
      return;
    }

    if (e.key === "?") {
      e.preventDefault();
      const current = this.api.keyboardShortcutsOverlaySubject.value;
      this.api.keyboardShortcutsOverlaySubject.next(!current);
      this.api.controlsSelectorComponentActive.next(!current);
    } else if (key >= "0" && key <= "9") {
      e.preventDefault();
      this.api.jumpToVideoPercentage(key);
    }
  };

  /**
   * Builds the key-to-action lookup table from the given configuration. Called from the
   * `keyActions` computed, so this only re-runs when the configuration actually changes.
   * `playPause` is handled separately in `onKeydown` since it matches `e.code`, not `e.key`.
   * Entries with an unbound (`undefined`) key never match — that's how a control
   * without an assigned shortcut stays inactive.
   */
  private buildKeyActions(config: EvaKeyboardShortcutsConfigurationTransformed): KeyAction[] {
    return [
      {
        key: config.backwardsKeyOne,
        run: (): void => {
          this.api.seekBack(config.backwardSeconds);
        },
      },
      {
        key: config.forwardKeyOne,
        run: (): void => {
          this.api.seekForward(config.forwardSeconds);
        },
      },
      {
        key: config.backwardsKeyTwo,
        run: (): void => {
          this.api.seekBack(config.backwardSeconds);
        },
      },
      {
        key: config.forwardKeyTwo,
        run: (): void => {
          this.api.seekForward(config.forwardSeconds);
        },
      },
      {
        key: config.fullscreen,
        run: (): void => {
          this.fullscreenService.toggleFullscreen().catch(() => {
            /* Ignored — browser may reject without user gesture */
          });
        },
      },
      {
        key: config.muteKey,
        run: (): void => {
          this.api.muteOrUnmuteVideo();
        },
      },
      {
        key: config.volumeUp,
        run: (): void => {
          this.api.stepVolume(1);
        },
      },
      {
        key: config.volumeDown,
        run: (): void => {
          this.api.stepVolume(-1);
        },
      },
      {
        key: config.oneFrameBackward,
        run: (): void => {
          this.api.seekBack(FRAME_DURATION_SECONDS);
        },
      },
      {
        key: config.oneFrameForward,
        run: (): void => {
          this.api.seekForward(FRAME_DURATION_SECONDS);
        },
      },
      {
        key: config.screenshotKey,
        run: (): void => {
          this.api.captureScreenshot().catch(() => {
            /* Ignored — screenshot capture failed (e.g. cross-origin tainted canvas) */
          });
        },
      },
      {
        key: config.pictureInPictureKey,
        run: (): void => {
          this.api.changePictureInPictureStatus().catch(() => {
            /* Ignored — browser may reject without user gesture */
          });
        },
      },
      {
        key: config.cinemaModeKey,
        run: (): void => {
          this.api.toggleCinemaMode();
        },
      },
      {
        key: config.loopKey,
        run: (): void => {
          this.api.toggleLoop();
        },
      },
      {
        key: config.downloadKey,
        run: (): void => {
          this.api.triggerDownload();
        },
      },
      {
        key: config.remotePlaybackKey,
        run: (): void => {
          this.api.promptRemotePlayback();
        },
      },
      {
        key: config.retryKey,
        run: (): void => {
          this.api.retryVideo();
        },
      },
      {
        key: config.nextQualityKey,
        run: (): void => {
          this.api.cycleQuality(1);
        },
      },
      {
        key: config.previousQualityKey,
        run: (): void => {
          this.api.cycleQuality(-1);
        },
      },
      {
        key: config.nextAudioTrackKey,
        run: (): void => {
          this.api.cycleAudioTrack(1);
        },
      },
      {
        key: config.previousAudioTrackKey,
        run: (): void => {
          this.api.cycleAudioTrack(-1);
        },
      },
      {
        key: config.nextSubtitleTrackKey,
        run: (): void => {
          this.api.cycleSubtitleTrack(1);
        },
      },
      {
        key: config.previousSubtitleTrackKey,
        run: (): void => {
          this.api.cycleSubtitleTrack(-1);
        },
      },
      {
        key: config.increasePlaybackSpeedKey,
        run: (): void => {
          this.api.increasePlaybackSpeed();
        },
      },
      {
        key: config.decreasePlaybackSpeedKey,
        run: (): void => {
          this.api.decreasePlaybackSpeed();
        },
      },
      {
        key: config.nextChapterKey,
        run: (): void => {
          this.api.jumpToNextChapter();
        },
      },
      {
        key: config.previousChapterKey,
        run: (): void => {
          this.api.jumpToPreviousChapter();
        },
      },
    ];
  }
}
