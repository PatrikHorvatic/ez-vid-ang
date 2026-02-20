import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  NgZone,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal
} from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaChapterMarker, EvaTimeFormating } from '../../types';
import { EvaScrubBarAria, EvaScrubBarAriaTransformed, transformEvaScrubBarAria } from '../../utils/aria-utilities';
import { transformTimeoutDuration } from '../../utils/utilities';

/**
 * Scrub bar (seek bar) component for the Eva video player.
 *
 * Renders as a `role="slider"` element with `tabindex="0"`, exposing the current
 * playback position as a percentage via `aria-valuenow` and `aria-valuetext`.
 * The range is always `0` to `100`.
 *
 * Features:
 * - **Seeking** — click or drag to seek. Sliding can be disabled via `evaSlidingEnabled`.
 * - **Hover tooltip** — displays the time at the hovered position. Disabled via `evaShowTimeOnHover`.
 * - **Chapter markers** — renders chapter markers on the bar. Accepts chapters via `evaChapters`
 *   or falls back to a VTT `chapters`/`metadata` text track on the video element.
 * - **Auto-hide** — when `hideWithControlsContainer` is `true`, the bar hides after
 *   `evaAutohideTime` ms of inactivity, in sync with the controls container.
 *
 * Mouse and touch event listeners for seeking and hover are registered outside Angular
 * via `NgZone.runOutsideAngular` to avoid unnecessary change detection cycles.
 * State updates that affect the view are explicitly run back inside the zone via `runInZone`.
 *
 * Keyboard support (when focused):
 * - `ArrowRight` / `ArrowUp` — seek forward
 * - `ArrowLeft` / `ArrowDown` — seek back
 *
 * @example
 * // Minimal usage
 * <eva-scrub-bar />
 *
 * @example
 * // With chapters and custom time format
 * <eva-scrub-bar
 *   [evaChapters]="chapters"
 *   evaTimeFormat="HH:mm:ss"
 * />
 *
 * @example
 * // Auto-hide in sync with controls container
 * <eva-scrub-bar
 *   [hideWithControlsContainer]="true"
 *   [evaAutohideTime]="4000"
 * />
 */
@Component({
  selector: 'eva-scrub-bar',
  templateUrl: './scrub-bar.html',
  styleUrl: './scrub-bar.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "slider",
    "[attr.aria-label]": "ariaLabel()",
    "aria-level": "polite",
    "[attr.aria-valuenow]": "getPercentage()",
    "aria-valuemin": "0",
    "aria-valuemax": "100",
    "[attr.aria-valuetext]": "getPercentage()",
    "[class.hide]": "hideControls()",
  }
})
export class EvaScrubBar implements OnInit, AfterViewInit, OnDestroy {
  protected evaAPI = inject(EvaApi);
  private elementRef = inject(ElementRef<HTMLElement>);

  /** Optionally injected `NgZone`. When present, document listeners run outside Angular to avoid unnecessary change detection. */
  private ngZone = inject(NgZone, { optional: true });

  /**
   * ARIA label for the scrub bar slider.
   *
   * All properties are optional — default values are applied via `transformEvaScrubBarAria`.
   */
  readonly evaAria = input<EvaScrubBarAriaTransformed, EvaScrubBarAria>(transformEvaScrubBarAria(undefined), { transform: transformEvaScrubBarAria });

  /**
   * When `true`, the scrub bar participates in the controls container auto-hide behaviour,
   * hiding after `evaAutohideTime` ms of inactivity.
   *
   * @default false
   */
  readonly hideWithControlsContainer = input<boolean>(false);

  /**
   * When `true`, the user can click and drag along the bar to seek.
   * When `false`, only a single click-to-seek is supported.
   *
   * @default true
   */
  readonly evaSlidingEnabled = input<boolean>(true);

  /**
   * Duration in milliseconds before the scrub bar auto-hides when
   * `hideWithControlsContainer` is `true`. Transformed via `transformTimeoutDuration`.
   *
   * @default 3000
   */
  readonly evaAutohideTime = input<number, number>(3000, { transform: transformTimeoutDuration });

  /**
   * When `true`, a tooltip showing the time at the hovered position is displayed
   * while the mouse is over the scrub bar.
   *
   * @default true
   */
  readonly evaShowTimeOnHover = input<boolean>(true);

  /**
   * Time format used for the hover tooltip and any time display within the scrub bar.
   *
   * Accepted values: `'HH:mm:ss'`, `'mm:ss'`, `'ss'`.
   *
   * @default 'mm:ss'
   */
  readonly evaTimeFormat = input<EvaTimeFormating>('mm:ss');

  /**
   * When `true`, chapter markers are rendered on the scrub bar.
   * Chapters are sourced from `evaChapters` or, as a fallback, from a VTT
   * `chapters`/`metadata` text track on the video element.
   *
   * @default true
   */
  readonly evaShowChapters = input<boolean>(true);

  /**
   * Chapter markers to display on the scrub bar.
   *
   * If provided and non-empty, these take priority over any VTT text track on the video element.
   * Only used when `evaShowChapters` is `true`.
   *
   * @default []
   */
  readonly evaChapters = input<EvaChapterMarker[]>([]);

  /** Whether the scrub bar is currently hidden. Applies the `hide` class to the host. */
  protected hideControls: WritableSignal<boolean> = signal(false);

  /** The formatted time string to display in the hover tooltip, or `null` when not hovering. */
  protected hoverTime: WritableSignal<string | null> = signal(null);

  /** The chapter title at the current hover position, or `null` if no chapter is active there. */
  protected hoverChapter: WritableSignal<string | null> = signal(null);

  /** The horizontal pixel offset of the hover tooltip relative to the scrub bar's left edge. */
  protected hoverLeft: WritableSignal<number> = signal(0);

  /** The active chapter markers rendered on the scrub bar. Populated from `evaChapters` or a VTT track. */
  protected chapters: WritableSignal<EvaChapterMarker[]> = signal([]);

  /** Resolves the `aria-label` from the transformed aria input. */
  protected ariaLabel = computed<string>(() => {
    return this.evaAria().ariaLabel;
  });

  /** Whether the user is currently dragging/seeking along the scrub bar. */
  private isSeeking = false;

  /** Whether the video was playing before a seek started. Used to resume playback after seek. */
  private wasPlaying = false;

  /** Holds the pending play promise to safely pause after seek without unhandled rejections. */
  private playPromise: Promise<void> | null = null;

  /** Subscription to user interaction events for the auto-hide feature. */
  private userInteraction$: Subscription | null = null;

  /** Reference to the auto-hide timeout. Cleared when new interaction is detected. */
  private hideTimeout: any;

  /**
   * Starts listening for user interaction events if `hideWithControlsContainer` is enabled,
   * and initializes chapter markers.
   */
  ngOnInit(): void {
    if (this.hideWithControlsContainer()) {
      this.startListening();
    }
    this.initChapters();
  }

  /**
   * Registers `mousemove` and `touchmove` document listeners outside Angular's zone
   * to handle seeking and hover tooltip updates without triggering change detection on every event.
   */
  ngAfterViewInit(): void {
    const registerListeners = () => {
      document.addEventListener('mousemove', this.onDocumentMouseMove);
      document.addEventListener('touchmove', this.onDocumentTouchMove, { passive: true });
      // this.elementRef.nativeElement.addEventListener('mousemove', this.onHostMouseMove);
      // this.elementRef.nativeElement.addEventListener('mouseleave', this.onHostMouseLeave);
    };

    if (this.ngZone) {
      this.ngZone.runOutsideAngular(registerListeners);
    } else {
      registerListeners();
    }
  }

  /** Unsubscribes from all subscriptions, clears the hide timeout, and removes all document/host listeners. */
  ngOnDestroy(): void {
    this.userInteraction$?.unsubscribe();
    if (this.hideTimeout) clearTimeout(this.hideTimeout);

    document.removeEventListener('mousemove', this.onDocumentMouseMove);
    document.removeEventListener('touchmove', this.onDocumentTouchMove);
    this.elementRef.nativeElement.removeEventListener('mousemove', this.onHostMouseMove);
    this.elementRef.nativeElement.removeEventListener('mouseleave', this.onHostMouseLeave);
  }

  /**
   * Returns the current playback position as a percentage string (e.g. `"42%"`).
   * Used for both `aria-valuenow` and `aria-valuetext`.
   * Returns `"0%"` if total duration is not yet available.
   */
  protected getPercentage(): string {
    const time = this.evaAPI.time();
    if (!time.total) return '0%';
    return Math.round((time.current * 100) / time.total) + '%';
  }

  /**
   * Returns the CSS `left` percentage for a chapter marker's start position on the scrub bar.
   *
   * @param chapter - The chapter marker to calculate the position for.
   */
  protected getChapterLeftPercent(chapter: EvaChapterMarker): string {
    const total = this.evaAPI.time().total;
    if (!total) return '0%';
    return (chapter.startTime / total) * 100 + '%';
  }

  /**
   * Returns the CSS `width` percentage for a chapter marker on the scrub bar,
   * calculated from its start and end times.
   *
   * @param chapter - The chapter marker to calculate the width for.
   */
  protected getChapterWidthPercent(chapter: EvaChapterMarker): string {
    const total = this.evaAPI.time().total;
    if (!total) return '0%';
    return ((chapter.endTime - chapter.startTime) / total) * 100 + '%';
  }

  /**
   * Handles `mousedown` on the host element.
   * If sliding is enabled, begins a drag seek. Otherwise performs an immediate click-to-seek.
   * No-ops for live streams.
   */
  @HostListener('mousedown', ['$event'])
  protected mouseDownScrub(e: MouseEvent) {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;

    if (this.evaSlidingEnabled()) {
      this.seekStart();
    } else {
      this.seekEnd(this.getOffsetFromEvent(e.clientX));
    }
  }

  /**
   * Handles `mouseup` on the document.
   * Finalizes a drag seek if one is in progress and sliding is enabled.
   * No-ops for live streams.
   */
  @HostListener('document:mouseup', ['$event'])
  protected mouseUpScrubBar(e: MouseEvent) {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;

    if (this.evaSlidingEnabled() && this.isSeeking) {
      this.seekEnd(this.getOffsetFromEvent(e.clientX));
    }
  }

  /**
   * Handles `touchstart` on the host element.
   * If sliding is enabled, begins a drag seek. Otherwise performs an immediate touch-to-seek.
   * No-ops for live streams.
   */
  @HostListener('touchstart', ['$event'])
  protected touchStartScrub(_e: TouchEvent) {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;

    if (this.evaSlidingEnabled()) {
      this.seekStart();
    } else {
      this.seekEnd(false);
    }
  }

  /**
   * Handles `touchcancel` on the document.
   * Ends a touch seek if one is in progress and sliding is enabled.
   * No-ops for live streams.
   */
  @HostListener('document:touchcancel', ['$event'])
  protected touchCancelScrub(_e: TouchEvent) {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;

    if (this.evaSlidingEnabled() && this.isSeeking) {
      this.touchEnd();
    }
  }

  /**
   * Handles `touchend` on the document.
   * Ends a touch seek if one is in progress and sliding is enabled.
   * No-ops for live streams.
   */
  @HostListener('document:touchend', ['$event'])
  protected touchEndScrub(_e: TouchEvent) {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;

    if (this.evaSlidingEnabled() && this.isSeeking) {
      this.touchEnd();
    }
  }

  /**
   * Handles `keydown` on the host element.
   * - `ArrowRight` / `ArrowUp` (38, 39) — seek forward via `EvaApi.seekForward()`
   * - `ArrowLeft` / `ArrowDown` (37, 40) — seek back via `EvaApi.seekBack()`
   * No-ops for live streams.
   */
  @HostListener('keydown', ['$event'])
  protected arrowAdjustTime(e: KeyboardEvent) {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;

    if (e.keyCode === 38 || e.keyCode === 39) {
      e.preventDefault();
      this.evaAPI.seekForward();
    } else if (e.keyCode === 37 || e.keyCode === 40) {
      e.preventDefault();
      this.evaAPI.seekBack();
    }
  }

  /**
   * Document-level `mousemove` handler registered outside Angular's zone.
   *
   * Handles two concerns:
   * - **Seeking**: if a drag seek is in progress, updates `currentTime` based on mouse position.
   * - **Hover tooltip**: if `evaShowTimeOnHover` is enabled and the mouse is over the scrub bar,
   *   calculates and updates `hoverTime`, `hoverLeft`, and `hoverChapter`. Clears them when the
   *   mouse leaves the bar. Signal updates are run back inside the Angular zone via `runInZone`.
   */
  private onDocumentMouseMove = (e: MouseEvent) => {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;

    // Handle seeking
    if (this.evaSlidingEnabled() && this.isSeeking) {
      this.runInZone(() => this.seekMove(this.getOffsetFromEvent(e.clientX)));
    }

    // Handle tooltip - check if mouse is over the scrub bar
    if (this.evaShowTimeOnHover()) {
      const rect = this.elementRef.nativeElement.getBoundingClientRect();
      const isOverHost =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isOverHost) {
        const offset = e.clientX - rect.left;
        const scrollWidth = this.elementRef.nativeElement.scrollWidth;
        const percentage = Math.max(Math.min((offset * 100) / scrollWidth, 99.9), 0);
        const time = (percentage * this.evaAPI.time().total) / 100;
        const tooltipHalfWidth = 35;
        const clampedLeft = Math.max(tooltipHalfWidth, Math.min(offset, rect.width - tooltipHalfWidth));
        const formatted = this.formatTime(time);
        const chapter = this.getChapterAtTime(time);

        if (
          this.hoverLeft() !== clampedLeft ||
          this.hoverTime() !== formatted ||
          this.hoverChapter() !== chapter
        ) {
          this.runInZone(() => {
            this.hoverTime.set(formatted);
            this.hoverLeft.set(clampedLeft);
            this.hoverChapter.set(chapter);
          });
        }
      } else if (this.hoverTime() !== null) {
        // Mouse left the scrub bar
        this.runInZone(() => {
          this.hoverTime.set(null);
          this.hoverChapter.set(null);
        });
      }
    }
  };

  /**
   * Document-level `touchmove` handler registered outside Angular's zone.
   * Updates `currentTime` based on touch position during an active drag seek.
   */
  private onDocumentTouchMove = (e: TouchEvent) => {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;
    if (!this.evaSlidingEnabled() || !this.isSeeking) return;

    this.runInZone(() => this.seekMove(this.getTouchOffset(e)));
  };

  /**
   * Host-level `mousemove` handler (currently unused — registered but commented out in `ngAfterViewInit`).
   * Originally intended as an alternative hover tooltip approach scoped to the host element.
   */
  private onHostMouseMove = (e: MouseEvent) => {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;
    if (!this.evaShowTimeOnHover()) return;

    const offset = this.getOffsetFromEvent(e.clientX);
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const scrollWidth = this.elementRef.nativeElement.scrollWidth;

    console.log('onHostMouseMove fired', offset, scrollWidth, rect.width);

    const percentage = Math.max(Math.min((offset * 100) / scrollWidth, 99.9), 0);
    const time = (percentage * this.evaAPI.time().total) / 100;

    const tooltipHalfWidth = 35;
    const clampedLeft = Math.max(tooltipHalfWidth, Math.min(offset, rect.width - tooltipHalfWidth));
    const formatted = this.formatTime(time);
    const chapter = this.getChapterAtTime(time);

    console.log('formatted:', formatted, 'chapter:', chapter, 'clampedLeft:', clampedLeft);

    this.runInZone(() => {
      this.hoverTime.set(formatted);
      this.hoverLeft.set(clampedLeft);
      this.hoverChapter.set(chapter);
    });
  };

  /**
   * Host-level `mouseleave` handler (currently unused — registered but commented out in `ngAfterViewInit`).
   * Clears the hover tooltip when the mouse leaves the host element.
   */
  private onHostMouseLeave = () => {
    this.runInZone(() => {
      this.hoverTime.set(null);
      this.hoverChapter.set(null);
    });
  };

  /**
   * Begins a drag seek operation.
   * Records whether the video was playing and pauses it for the duration of the seek.
   * Safely handles any pending play promise to avoid unhandled rejections.
   */
  private seekStart() {
    if (!this.evaAPI.canPlay()) return;

    this.isSeeking = true;
    this.wasPlaying = !this.evaAPI.assignedVideoElement.paused;

    if (this.playPromise) {
      this.playPromise.then(() => {
        this.evaAPI.assignedVideoElement.pause();
      }).catch(() => { });
    } else {
      this.evaAPI.assignedVideoElement.pause();
    }

    this.playPromise = null;
  }

  /**
   * Updates `currentTime` during an active drag seek based on the horizontal offset.
   * Clamps the resulting percentage to `[0, 99.9]` to avoid edge-of-video issues.
   *
   * @param offsetX - Horizontal pixel offset from the left edge of the scrub bar.
   */
  private seekMove(offsetX: number) {
    if (!this.isSeeking) return;

    const percentage = Math.max(
      Math.min((offsetX * 100) / this.elementRef.nativeElement.scrollWidth, 99.9),
      0
    );
    const newTime = (percentage * this.evaAPI.time().total) / 100;
    if (isNaN(newTime) || newTime < 0) return;

    this.evaAPI.assignedVideoElement.currentTime = newTime;
  }

  /**
   * Finalizes a seek operation. Sets `currentTime` to the target position if an offset is provided,
   * then resumes playback if the video was playing before the seek started.
   *
   * @param offsetX - Horizontal pixel offset from the left edge of the scrub bar, or `false` to skip repositioning.
   */
  private seekEnd(offsetX: number | false) {
    this.isSeeking = false;
    if (!this.evaAPI.canPlay()) return;

    if (offsetX !== false) {
      const percentage = Math.max(
        Math.min((offsetX * 100) / this.elementRef.nativeElement.scrollWidth, 99.9),
        0
      );
      const newTime = (percentage * this.evaAPI.time().total) / 100;
      if (isNaN(newTime) || newTime < 0) return;

      this.evaAPI.assignedVideoElement.currentTime = newTime;
    }

    if (this.wasPlaying) {
      this.wasPlaying = false;
      this.evaAPI.pendingPlayAfterSeek = true;
    }
  }

  /**
   * Finalizes a touch seek without repositioning `currentTime`.
   * Resumes playback if the video was playing before the seek started.
   */
  private touchEnd() {
    this.isSeeking = false;
    if (this.wasPlaying) {
      this.wasPlaying = false;
      this.evaAPI.pendingPlayAfterSeek = true;
    }
  }

  /**
   * Initializes chapter markers on the scrub bar.
   *
   * Priority order:
   * 1. `evaChapters` input — used directly if non-empty.
   * 2. VTT text track — falls back to a `chapters` or `metadata` track on the video element.
   *    If the player is not yet ready, waits for `playerReadyEvent` before loading the track.
   */
  private initChapters() {
    if (!this.evaShowChapters()) return;

    // Priority 1: directly provided input
    if (this.evaChapters().length > 0) {
      this.chapters.set(this.evaChapters());
      return;
    }

    // Priority 2: fallback to VTT track on the video element
    if (this.evaAPI.isPlayerReady) {
      this.loadChaptersFromTrack();
    } else {
      const sub = this.evaAPI.playerReadyEvent.subscribe(() => {
        this.loadChaptersFromTrack();
        sub.unsubscribe();
      });
    }
  }

  /**
   * Scans the video element's text tracks for a `chapters` or `metadata` track
   * and parses its cues into `EvaChapterMarker` objects.
   * If cues are not yet available, waits for the track's `load` event.
   */
  private loadChaptersFromTrack() {
    const video = this.evaAPI.assignedVideoElement;
    const textTracks = video.textTracks;

    for (let i = 0; i < textTracks.length; i++) {
      const track = textTracks[i];
      if (track.kind === 'metadata' || track.kind === 'chapters') {
        track.mode = 'hidden';

        if (track.cues && track.cues.length > 0) {
          this.parseCues(track.cues);
        } else {
          track.addEventListener('load', () => {
            if (track.cues) this.parseCues(track.cues);
          });
        }
        break;
      }
    }
  }

  /**
   * Converts a `TextTrackCueList` into an array of `EvaChapterMarker` objects
   * and updates the `chapters` signal inside the Angular zone.
   *
   * @param cues - The list of VTT cues to parse.
   */
  private parseCues(cues: TextTrackCueList) {
    const parsed: EvaChapterMarker[] = [];
    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i] as VTTCue;
      parsed.push({
        startTime: cue.startTime,
        endTime: cue.endTime,
        title: cue.text
      });
    }
    this.runInZone(() => this.chapters.set(parsed));
  }

  /**
   * Returns the title of the chapter active at the given time, or `null` if none.
   *
   * @param time - Time in seconds to look up.
   */
  private getChapterAtTime(time: number): string | null {
    const chapters = this.chapters();
    if (!chapters.length) return null;
    const chapter = chapters.find(c => time >= c.startTime && time < c.endTime);
    return chapter ? chapter.title : null;
  }

  /**
   * Formats a time in seconds into a string according to `evaTimeFormat`.
   *
   * - `'HH:mm:ss'` → `"01:23:45"`
   * - `'mm:ss'` → `"23:45"`
   * - `'ss'` → `"45s"`
   *
   * @param seconds - The time in seconds to format.
   */
  private formatTime(seconds: number): string {
    const format = this.evaTimeFormat();
    const totalSeconds = Math.floor(seconds);

    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    switch (format) {
      case 'HH:mm:ss': return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
      case 'mm:ss': return `${pad(mm)}:${pad(ss)}`;
      case 'ss': return `${pad(ss)}s`;
    }
  }

  /**
   * Converts a mouse event's `clientX` to a pixel offset relative to the scrub bar's left edge.
   *
   * @param clientX - The `clientX` value from a `MouseEvent`.
   */
  private getOffsetFromEvent(clientX: number): number {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    return clientX - rect.left;
  }

  /**
   * Converts a touch event's first touch point to a pixel offset relative to the scrub bar's left edge.
   *
   * @param event - The `TouchEvent` to extract the offset from.
   */
  private getTouchOffset(event: TouchEvent): number {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    return event.touches[0].clientX - rect.left;
  }

  /**
   * Runs a function inside the Angular zone if `NgZone` is available, otherwise calls it directly.
   * Used to bring signal updates back into the zone after handlers registered with `runOutsideAngular`.
   *
   * @param fn - The function to execute inside the zone.
   */
  private runInZone(fn: () => void): void {
    if (this.ngZone) {
      this.ngZone.run(fn);
    } else {
      fn();
    }
  }

  /**
   * Subscribes to `EvaApi.triggerUserInteraction` to reset the auto-hide timer
   * on every user interaction, keeping the scrub bar visible during activity.
   */
  private startListening() {
    this.userInteraction$ = this.evaAPI.triggerUserInteraction.subscribe(() => {
      if (this.hideTimeout) clearTimeout(this.hideTimeout);
      this.prepareHiding();
    });
  }

  /**
   * Shows the scrub bar immediately and schedules it to hide after `evaAutohideTime` ms.
   * Any previously scheduled hide is cancelled before scheduling a new one.
   */
  private prepareHiding() {
    this.hideControls.set(false);
    this.hideTimeout = setTimeout(() => {
      this.hideControls.set(true);
    }, this.evaAutohideTime());
  }
}