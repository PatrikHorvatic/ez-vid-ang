import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaChapterMarker } from '../../types';

/**
 * Floating panel that displays all available chapters in a scrollable list.
 *
 * Opens/closes via `evaChapterListOpen` input, which can be toggled at runtime
 * (e.g. from `EvaActiveChapter`'s click event). Each chapter item shows its title
 * and formatted start time. Clicking a chapter seeks the video to that position.
 *
 * The currently active chapter is highlighted automatically via
 * `EvaApi.activeChapterSubject`.
 *
 * Chapters are sourced from `EvaApi.chapterMarkerChangesSubject`, which is
 * populated either from the `evaChapters` input on the scrub bar or from VTT
 * chapter tracks.
 *
 * The panel can be dismissed by:
 * - Clicking the close button (×) in the header.
 * - Pressing `Escape` anywhere on the page.
 * - Clicking outside the panel.
 *
 * All three emit `evaChapterListClose`.
 *
 * @example
 * <eva-chapter-list
 *   [evaChapterListOpen]="isChapterListOpen()"
 *   (evaChapterListClose)="isChapterListOpen.set(false)"
 * />
 */
@Component({
  selector: 'eva-chapter-list',
  templateUrl: './chapter-list.html',
  styleUrl: './chapter-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "role": "navigation",
    "[attr.aria-label]": "evaChapterListTitle()",
    "[class.eva-chapter-list-open]": "evaChapterListOpen()",
    "[class.eva-chapter-list-left]": "evaChapterListPosition() === 'left'",
    "[class.eva-chapter-list-right]": "evaChapterListPosition() === 'right'",
    "(document:keydown.escape)": "onEscape()",
    "(document:click)": "onDocumentClick($event)",
  }
})
export class EvaChapterList implements OnInit, OnDestroy {
  protected evaApi = inject(EvaApi);

  /** Host element reference, used by `onDocumentClick` to detect clicks outside the panel. */
  private el = inject(ElementRef<HTMLElement>);

  /** Timestamp when the panel was last opened. Used to ignore the same click event that triggered the open. */
  private openedAt = 0;

  constructor() {
    effect(() => {
      if (this.evaChapterListOpen()) {
        this.openedAt = Date.now();
      }
    });
  }

  /**
   * Whether the chapter list panel is open.
   * Can be toggled at runtime to show/hide the panel.
   *
   * @default false
   */
  readonly evaChapterListOpen = input<boolean>(false);

  /**
   * Title displayed at the top of the chapter list panel.
   *
   * @default "Chapters"
   */
  readonly evaChapterListTitle = input<string>('Chapters');

  /**
   * Which top corner of the player the panel appears in.
   *
   * @default "right"
   */
  readonly evaChapterListPosition = input<'left' | 'right'>('right');

  /**
   * Text displayed when no chapters are available.
   *
   * @default "No chapters available"
   */
  readonly evaChapterListEmptyText = input<string>('No chapters available');

  /** Emitted when the panel should close (close button, Escape key, or click outside). The consumer should set `evaChapterListOpen` to `false`. */
  readonly evaChapterListClose = output<void>();

  /** All available chapter markers. */
  protected chapters = signal<EvaChapterMarker[]>([]);

  /** The start time of the currently active chapter, used for highlighting. */
  protected activeChapterStartTime = signal<number | null>(null);

  protected hasChapters = computed(() => this.chapters().length > 0);

  protected formattedChapters = computed(() => {
    const activeStart = this.activeChapterStartTime();
    return this.chapters().map(c => ({
      ...c,
      formattedStart: this.formatTime(c.startTime),
      formattedDuration: this.formatDuration(c.startTime, c.endTime),
      isActive: activeStart !== null && c.startTime === activeStart,
    }));
  });

  private chaptersSub: Subscription | null = null;
  private activeSub: Subscription | null = null;

  ngOnInit(): void {
    this.chaptersSub = this.evaApi.chapterMarkerChangesSubject.subscribe(chapters => {
      this.chapters.set(chapters ?? []);
    });
    this.activeSub = this.evaApi.activeChapterSubject.subscribe(chapter => {
      this.activeChapterStartTime.set(chapter?.startTime ?? null);
    });
  }

  ngOnDestroy(): void {
    this.chaptersSub?.unsubscribe();
    this.activeSub?.unsubscribe();
  }

  protected closePanel(): void {
    this.evaChapterListClose.emit();
  }

  /** Closes the panel when `Escape` is pressed, if the panel is currently open. */
  protected onEscape(): void {
    if (this.evaChapterListOpen()) {
      this.closePanel();
    }
  }

  /** Closes the panel when the user clicks outside of it. Ignores the click that opened the panel. */
  protected onDocumentClick(e: MouseEvent): void {
    if (!this.evaChapterListOpen()) return;
    if (Date.now() - this.openedAt < 50) return;
    if (!this.el.nativeElement.contains(e.target as Node)) {
      this.closePanel();
    }
  }

  /** Seeks the video to the chapter's start time with proper seek coordination. */
  protected seekToChapter(chapter: EvaChapterMarker): void {
    if (!this.evaApi.validateVideoAndPlayerBeforeAction()) return;
    if (chapter.startTime < 0 || !isFinite(chapter.startTime)) return;

    const wasPlaying = !this.evaApi.assignedVideoElement!.paused;
    this.evaApi.isSeeking.set(true);
    this.evaApi.assignedVideoElement!.currentTime = chapter.startTime;
    this.evaApi.time.update(a => ({
      ...a,
      current: chapter.startTime,
      remaining: a.total - chapter.startTime
    }));
    this.evaApi.activeChapterSubject.next(chapter);
    if (wasPlaying) {
      this.evaApi.pendingPlayAfterSeek = true;
    }
  }

  protected onKeydown(e: KeyboardEvent, chapter: EvaChapterMarker): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.seekToChapter(chapter);
    }
  }

  private formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '00:00';
    const total = Math.floor(seconds);
    const hh = Math.floor(total / 3600);
    const mm = Math.floor((total % 3600) / 60);
    const ss = total % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    if (hh > 0) return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
    return `${pad(mm)}:${pad(ss)}`;
  }

  private formatDuration(startTime: number, endTime: number): string {
    if (!isFinite(startTime) || !isFinite(endTime)) return '';
    const duration = endTime - startTime;
    if (duration <= 0) return '';
    return this.formatTime(duration);
  }
}
