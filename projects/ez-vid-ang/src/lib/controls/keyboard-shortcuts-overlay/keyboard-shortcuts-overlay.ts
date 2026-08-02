import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, signal, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { EvaApi } from "../../api/eva-api";
import { EvaKeyboardShortcutsConfigurationTransformed } from "../../types";
import { CLICK_OUTSIDE_DEBOUNCE_MS } from "../../constants";
import { EvaKeyboardShortcutsOverlayLabels, EvaKeyboardShortcutsOverlayLabelsTransformed, transformEvaKeyboardShortcutsOverlayLabels } from "../../utils/aria-utilities";

/**
 * Represents a single shortcut entry displayed in the overlay.
 */
type ShortcutEntry = {
  keys: string[];
  description: string;
};

/**
 * Represents a group of related shortcuts displayed under a common heading.
 */
type ShortcutGroup = {
  title: string;
  shortcuts: ShortcutEntry[];
};

const KEY_DISPLAY_MAP: Record<string, string> = {
  ARROWLEFT: "←",
  ARROWRIGHT: "→",
  ARROWUP: "↑",
  ARROWDOWN: "↓",
  SPACE: "Space",
};

function formatKeyLabel(key: string): string {
  return KEY_DISPLAY_MAP[key] ?? key;
}

/**
 * Keyboard shortcuts overlay for the Eva video player.
 *
 * Displays a centered panel listing all configured keyboard shortcuts,
 * grouped by category (playback, seeking, media). The overlay is toggled
 * automatically by the `EvaKeyboardShortcuts` directive when the user
 * presses `?`.
 *
 * The component reads its open state and configuration from `EvaApi` —
 * no wiring is needed beyond placing it inside `<eva-player>`.
 *
 * All group headings and shortcut descriptions are localizable via the
 * `evaShortcutsOverlayLabels` input — see `EvaKeyboardShortcutsOverlayLabels`.
 *
 * The component is fully standalone and tree-shakable — it is only
 * included in the bundle when imported and used in a template.
 *
 * The overlay closes when:
 * - The close button is clicked.
 * - `Escape` is pressed.
 * - A click is detected outside the overlay.
 *
 * @example
 * <eva-player [evaKeyboardShortcutsEnabled]="true">
 *   <eva-keyboard-shortcuts-overlay />
 *   <eva-controls-container>...</eva-controls-container>
 * </eva-player>
 */
@Component({
  selector: "eva-keyboard-shortcuts-overlay",
  templateUrl: "./keyboard-shortcuts-overlay.html",
  styleUrl: "./keyboard-shortcuts-overlay.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: "dialog",
    "[attr.aria-label]": "evaShortcutsOverlayTitle()",
    "[class.eva-shortcuts-overlay-open]": "isOpen()",
    "(document:keydown.escape)": "onEscape()",
    "(document:click)": "onDocumentClick($event)",
  },
})
export class EvaKeyboardShortcutsOverlay implements OnInit, OnDestroy {
  private readonly evaAPI = inject(EvaApi);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Title displayed at the top of the overlay.
   *
   * @default "Keyboard shortcuts"
   */
  public readonly evaShortcutsOverlayTitle = input<string>("Keyboard shortcuts");

  /**
   * Localizable text for the overlay's group headings and per-shortcut descriptions.
   * All properties are optional — any omitted property falls back to its English default.
   *
   * @example
   * <eva-keyboard-shortcuts-overlay
   *   [evaShortcutsOverlayLabels]="{
   *     groupPlayback: 'Reprodukcija',
   *     playPause: 'Pokreni / Pauziraj',
   *     seekBackward: (s) => `Premotaj unazad ${s}s`,
   *   }"
   * />
   */
  public readonly evaShortcutsOverlayLabels = input<EvaKeyboardShortcutsOverlayLabelsTransformed, EvaKeyboardShortcutsOverlayLabels>(transformEvaKeyboardShortcutsOverlayLabels(undefined), {
    transform: transformEvaKeyboardShortcutsOverlayLabels,
  });

  /** Whether the overlay is currently visible. Driven by `EvaApi.keyboardShortcutsOverlaySubject`. */
  protected readonly isOpen = signal(false);

  /** The resolved keyboard shortcuts configuration from `EvaApi`. */
  private readonly config = signal<EvaKeyboardShortcutsConfigurationTransformed | null>(null);

  /** Timestamp when the overlay was last opened. Used to debounce outside clicks. */
  private openedAt = 0;

  private overlaySub: Subscription | null = null;
  private configSub: Subscription | null = null;

  /** Grouped shortcut entries derived from the configuration. */
  protected readonly shortcutGroups = computed<ShortcutGroup[]>(() => {
    const cfg = this.config();
    if (!cfg) {
      return [];
    }
    return this.buildGroups(cfg, this.evaShortcutsOverlayLabels());
  });

  public ngOnInit(): void {
    this.overlaySub = this.evaAPI.keyboardShortcutsOverlaySubject.subscribe((open) => {
      this.isOpen.set(open);
      if (open) {
        this.openedAt = Date.now();
      }
    });
    this.configSub = this.evaAPI.keyboardShortcutsConfigSubject.subscribe((cfg) => {
      this.config.set(cfg);
    });
  }

  public ngOnDestroy(): void {
    this.overlaySub?.unsubscribe();
    this.configSub?.unsubscribe();
  }

  protected closeOverlay(): void {
    this.evaAPI.keyboardShortcutsOverlaySubject.next(false);
    this.evaAPI.controlsSelectorComponentActive.next(false);
  }

  protected onEscape(): void {
    if (this.isOpen()) {
      this.closeOverlay();
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) {
      return;
    }
    if (Date.now() - this.openedAt < CLICK_OUTSIDE_DEBOUNCE_MS) {
      return;
    }

    if (!(event.target instanceof Node) || !this.el.nativeElement.contains(event.target)) {
      this.closeOverlay();
    }
  }

  private buildGroups(cfg: EvaKeyboardShortcutsConfigurationTransformed, labels: EvaKeyboardShortcutsOverlayLabelsTransformed): ShortcutGroup[] {
    const playback: ShortcutEntry[] = [];
    if (cfg.playPause) {
      playback.push({ keys: [formatKeyLabel(cfg.playPause)], description: labels.playPause });
    }
    if (cfg.increasePlaybackSpeedKey) {
      playback.push({ keys: [formatKeyLabel(cfg.increasePlaybackSpeedKey)], description: labels.increasePlaybackSpeed });
    }
    if (cfg.decreasePlaybackSpeedKey) {
      playback.push({ keys: [formatKeyLabel(cfg.decreasePlaybackSpeedKey)], description: labels.decreasePlaybackSpeed });
    }

    const seeking: ShortcutEntry[] = [];

    if (cfg.backwardsKeyOne || cfg.backwardsKeyTwo) {
      const keys: string[] = [];
      if (cfg.backwardsKeyOne) {
        keys.push(formatKeyLabel(cfg.backwardsKeyOne));
      }
      if (cfg.backwardsKeyTwo) {
        keys.push(formatKeyLabel(cfg.backwardsKeyTwo));
      }
      seeking.push({ keys, description: labels.seekBackward(cfg.backwardSeconds) });
    }

    if (cfg.forwardKeyOne || cfg.forwardKeyTwo) {
      const keys: string[] = [];
      if (cfg.forwardKeyOne) {
        keys.push(formatKeyLabel(cfg.forwardKeyOne));
      }
      if (cfg.forwardKeyTwo) {
        keys.push(formatKeyLabel(cfg.forwardKeyTwo));
      }
      seeking.push({ keys, description: labels.seekForward(cfg.forwardSeconds) });
    }

    if (cfg.oneFrameBackward) {
      seeking.push({ keys: [formatKeyLabel(cfg.oneFrameBackward)], description: labels.previousFrame });
    }
    if (cfg.oneFrameForward) {
      seeking.push({ keys: [formatKeyLabel(cfg.oneFrameForward)], description: labels.nextFrame });
    }
    if (cfg.nextChapterKey) {
      seeking.push({ keys: [formatKeyLabel(cfg.nextChapterKey)], description: labels.nextChapter });
    }
    if (cfg.previousChapterKey) {
      seeking.push({ keys: [formatKeyLabel(cfg.previousChapterKey)], description: labels.previousChapter });
    }

    seeking.push({ keys: ["0", "–", "9"], description: labels.jumpToPercentage });

    const media: ShortcutEntry[] = [];

    if (cfg.muteKey) {
      media.push({ keys: [formatKeyLabel(cfg.muteKey)], description: labels.muteUnmute });
    }
    if (cfg.volumeUp) {
      media.push({ keys: [formatKeyLabel(cfg.volumeUp)], description: labels.increaseVolume });
    }
    if (cfg.volumeDown) {
      media.push({ keys: [formatKeyLabel(cfg.volumeDown)], description: labels.decreaseVolume });
    }
    if (cfg.fullscreen) {
      media.push({ keys: [formatKeyLabel(cfg.fullscreen)], description: labels.toggleFullscreen });
    }
    if (cfg.pictureInPictureKey) {
      media.push({ keys: [formatKeyLabel(cfg.pictureInPictureKey)], description: labels.togglePictureInPicture });
    }
    if (cfg.cinemaModeKey) {
      media.push({ keys: [formatKeyLabel(cfg.cinemaModeKey)], description: labels.toggleCinemaMode });
    }
    if (cfg.loopKey) {
      media.push({ keys: [formatKeyLabel(cfg.loopKey)], description: labels.toggleLoop });
    }
    if (cfg.screenshotKey) {
      media.push({ keys: [formatKeyLabel(cfg.screenshotKey)], description: labels.captureScreenshot });
    }
    if (cfg.downloadKey) {
      media.push({ keys: [formatKeyLabel(cfg.downloadKey)], description: labels.downloadVideo });
    }
    if (cfg.remotePlaybackKey) {
      media.push({ keys: [formatKeyLabel(cfg.remotePlaybackKey)], description: labels.castAirplay });
    }
    if (cfg.retryKey) {
      media.push({ keys: [formatKeyLabel(cfg.retryKey)], description: labels.retryAfterError });
    }

    media.push({ keys: ["?"], description: labels.showHideShortcuts });

    const tracks: ShortcutEntry[] = [];
    if (cfg.nextQualityKey) {
      tracks.push({ keys: [formatKeyLabel(cfg.nextQualityKey)], description: labels.nextQuality });
    }
    if (cfg.previousQualityKey) {
      tracks.push({ keys: [formatKeyLabel(cfg.previousQualityKey)], description: labels.previousQuality });
    }
    if (cfg.nextAudioTrackKey) {
      tracks.push({ keys: [formatKeyLabel(cfg.nextAudioTrackKey)], description: labels.nextAudioTrack });
    }
    if (cfg.previousAudioTrackKey) {
      tracks.push({ keys: [formatKeyLabel(cfg.previousAudioTrackKey)], description: labels.previousAudioTrack });
    }
    if (cfg.nextSubtitleTrackKey) {
      tracks.push({ keys: [formatKeyLabel(cfg.nextSubtitleTrackKey)], description: labels.nextSubtitleTrack });
    }
    if (cfg.previousSubtitleTrackKey) {
      tracks.push({ keys: [formatKeyLabel(cfg.previousSubtitleTrackKey)], description: labels.previousSubtitleTrack });
    }

    const groups: ShortcutGroup[] = [
      { title: labels.groupPlayback, shortcuts: playback },
      { title: labels.groupSeeking, shortcuts: seeking },
      { title: labels.groupMedia, shortcuts: media },
      { title: labels.groupTracksAndQuality, shortcuts: tracks },
    ];
    return groups.filter((group) => group.shortcuts.length > 0);
  }
}
