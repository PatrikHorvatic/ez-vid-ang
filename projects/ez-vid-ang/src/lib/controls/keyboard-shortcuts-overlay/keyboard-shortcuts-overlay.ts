import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaKeyboardShortcutsConfiguration } from '../../types';
import { CLICK_OUTSIDE_DEBOUNCE_MS } from '../../constants';

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
  'ARROWLEFT': '←',
  'ARROWRIGHT': '→',
  'ARROWUP': '↑',
  'ARROWDOWN': '↓',
  'SPACE': 'Space',
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
  selector: 'eva-keyboard-shortcuts-overlay',
  templateUrl: './keyboard-shortcuts-overlay.html',
  styleUrl: './keyboard-shortcuts-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'dialog',
    '[attr.aria-label]': 'evaShortcutsOverlayTitle()',
    '[class.eva-shortcuts-overlay-open]': 'isOpen()',
    '(document:keydown.escape)': 'onEscape()',
    '(document:click)': 'onDocumentClick($event)',
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
  public readonly evaShortcutsOverlayTitle = input<string>('Keyboard shortcuts');

  /** Whether the overlay is currently visible. Driven by `EvaApi.keyboardShortcutsOverlaySubject`. */
  protected readonly isOpen = signal(false);

  /** The resolved keyboard shortcuts configuration from `EvaApi`. */
  private readonly config = signal<Required<EvaKeyboardShortcutsConfiguration> | null>(null);

  /** Timestamp when the overlay was last opened. Used to debounce outside clicks. */
  private openedAt = 0;

  private overlaySub: Subscription | null = null;
  private configSub: Subscription | null = null;

  /** Grouped shortcut entries derived from the configuration. */
  protected readonly shortcutGroups = computed<ShortcutGroup[]>(() => {
    const cfg = this.config();
    if (!cfg) { return []; }
    return this.buildGroups(cfg);
  });

  public ngOnInit(): void {
    this.overlaySub = this.evaAPI.keyboardShortcutsOverlaySubject.subscribe(open => {
      this.isOpen.set(open);
      if (open) {
        this.openedAt = Date.now();
      }
    });
    this.configSub = this.evaAPI.keyboardShortcutsConfigSubject.subscribe(cfg => {
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
    if (!this.isOpen()) { return; }
    if (Date.now() - this.openedAt < CLICK_OUTSIDE_DEBOUNCE_MS) { return; }

    if (!(event.target instanceof Node) || !this.el.nativeElement.contains(event.target)) {
      this.closeOverlay();
    }
  }

  private buildGroups(cfg: Required<EvaKeyboardShortcutsConfiguration>): ShortcutGroup[] {
    const playback: ShortcutEntry[] = [
      { keys: [formatKeyLabel(cfg.playPause)], description: 'Play / Pause' },
    ];

    const seeking: ShortcutEntry[] = [];

    if (cfg.backwardsKeyOne || cfg.backwardsKeyTwo) {
      const keys: string[] = [];
      if (cfg.backwardsKeyOne) { keys.push(formatKeyLabel(cfg.backwardsKeyOne)); }
      if (cfg.backwardsKeyTwo) { keys.push(formatKeyLabel(cfg.backwardsKeyTwo)); }
      seeking.push({ keys, description: `Seek backward ${cfg.backwardSeconds}s` });
    }

    if (cfg.forwardKeyOne || cfg.forwardKeyTwo) {
      const keys: string[] = [];
      if (cfg.forwardKeyOne) { keys.push(formatKeyLabel(cfg.forwardKeyOne)); }
      if (cfg.forwardKeyTwo) { keys.push(formatKeyLabel(cfg.forwardKeyTwo)); }
      seeking.push({ keys, description: `Seek forward ${cfg.forwardSeconds}s` });
    }

    if (cfg.oneFrameBackward) {
      seeking.push({ keys: [formatKeyLabel(cfg.oneFrameBackward)], description: 'Previous frame' });
    }
    if (cfg.oneFrameForward) {
      seeking.push({ keys: [formatKeyLabel(cfg.oneFrameForward)], description: 'Next frame' });
    }

    seeking.push({ keys: ['0', '–', '9'], description: 'Jump to 0%–90%' });

    const media: ShortcutEntry[] = [];

    if (cfg.muteKey) {
      media.push({ keys: [formatKeyLabel(cfg.muteKey)], description: 'Mute / Unmute' });
    }
    if (cfg.fullscreen) {
      media.push({ keys: [formatKeyLabel(cfg.fullscreen)], description: 'Toggle fullscreen' });
    }

    media.push({ keys: ['?'], description: 'Show / hide shortcuts' });

    return [
      { title: 'Playback', shortcuts: playback },
      { title: 'Seeking', shortcuts: seeking },
      { title: 'Media', shortcuts: media },
    ];
  }
}
