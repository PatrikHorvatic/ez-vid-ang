import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  NgZone,
  signal,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { skip, Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaChapterMarker, EvaTimeFormating } from '../../types';
import { transformEvaScrubBarAria, EvaScrubBarAria, EvaScrubBarAriaTransformed } from '../../utils/aria-utilities';
import { transformTimeoutDuration } from '../../utils/utilities';
import { PERCENTAGE, SCRUB_BAR_MAX_SEEK_PERCENT, SECONDS_PER_HOUR, SECONDS_PER_MINUTE, TIME_DISPLAY_PAD_WIDTH, DEFAULT_AUTOHIDE_TIMEOUT_MS, SCRUB_BAR_TOOLTIP_HALF_WIDTH_PX } from '../../constants';

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
 * >
 * ...other scrub bar components
 * </eva-scrub-bar>
 */
@Component({
  selector: 'eva-scrub-bar',
  templateUrl: './scrub-bar.html',
  styleUrl: './scrub-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "slider",
    "[attr.aria-label]": "ariaLabel()",
    "[attr.aria-valuenow]": "getPercentage()",
    "aria-valuemin": "0",
    "aria-valuemax": "100",
    "[attr.aria-valuetext]": "getPercentage()",
    "[class.hide]": "hideControls()",
    "(mousedown)": "mouseDownScrub($event)",
    "(document:mouseup)": "mouseUpScrubBar($event)",
    "(touchstart)": "touchStartScrub($event)",
    "(document:touchcancel)": "touchCancelScrub($event)",
    "(document:touchend)": "touchEndScrub($event)",
    "(keydown)": "arrowAdjustTime($event)",
  }
})
export class EvaScrubBar implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  protected evaAPI = inject(EvaApi);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Optionally injected `NgZone`. When present, document listeners run outside Angular to avoid unnecessary change detection. */
  private readonly ngZone = inject(NgZone, { optional: true });

  /**
   * ARIA label for the scrub bar slider.
   *
   * All properties are optional — default values are applied via `transformEvaScrubBarAria`.
   */
  public readonly evaAria = input<EvaScrubBarAriaTransformed, EvaScrubBarAria>(transformEvaScrubBarAria(undefined), { transform: transformEvaScrubBarAria });

  /**
   * When `true`, the scrub bar participates in the controls container auto-hide behaviour,
   * hiding after `evaAutohideTime` ms of inactivity.
   *
   * @default false
   */
  public readonly hideWithControlsContainer = input<boolean>(false);

  /**
   * When `true`, the user can click and drag along the bar to seek.
   * When `false`, only a single click-to-seek is supported.
   *
   * @default true
   */
  public readonly evaSlidingEnabled = input<boolean>(true);

  /**
   * Duration in milliseconds before the scrub bar auto-hides when
   * `hideWithControlsContainer` is `true`. Transformed via `transformTimeoutDuration`.
   *
   * @default 3000
   */
  public readonly evaAutohideTime = input<number, number>(DEFAULT_AUTOHIDE_TIMEOUT_MS, { transform: transformTimeoutDuration });

  /**
   * When `true`, a tooltip showing the time at the hovered position is displayed
   * while the mouse is over the scrub bar.
   *
   * @default true
   */
  public readonly evaShowTimeOnHover = input<boolean>(true);

  /**
   * Time format used for the hover tooltip and any time display within the scrub bar.
   *
   * Accepted values: `'HH:mm:ss'`, `'mm:ss'`, `'ss'`.
   *
   * @default 'mm:ss'
   */
  public readonly evaTimeFormat = input<EvaTimeFormating>('mm:ss');

  /**
   * When `true`, chapter markers are rendered on the scrub bar.
   * Chapters are sourced from `evaChapters` or, as a fallback, from a VTT
   * `chapters`/`metadata` text track on the video element.
   *
   * @default true
   */
  public readonly evaShowChapters = input<boolean>(true);

  /**
 * Chapter markers to display on the scrub bar.
 *
 * If provided and non-empty, these take priority over any VTT text track on the video element.
 * Only used when `evaShowChapters` is `true`.
 *
 * @default []
 */
  public readonly evaChapters = input<EvaChapterMarker[]>([]);

  /** Whether the scrub bar is currently hidden. Applies the `hide` class to the host. */
  protected readonly hideControls = signal(false);

  /** The formatted time string to display in the hover tooltip, or `null` when not hovering. */
  protected readonly hoverTime = signal<string | null>(null);

  /** The chapter title at the current hover position, or `null` if no chapter is active there. */
  protected readonly hoverChapter = signal<string | null>(null);

  /** The horizontal pixel offset of the hover tooltip relative to the scrub bar's left edge. */
  protected readonly hoverLeft = signal(0);

  /** The active chapter markers rendered on the scrub bar. Populated from `evaChapters` or a VTT track. */
  protected readonly chapters = signal<EvaChapterMarker[]>([]);

  /** Resolves the `aria-label` from the transformed aria input. */
  protected readonly ariaLabel = computed<string>(() => this.evaAria().ariaLabel);

  /** Whether the user is currently dragging/seeking along the scrub bar. */
  private isSeeking = false;

  private isControlerSelectorActive = false;

  /** Whether the video was playing before a seek started. Used to resume playback after seek. */
  private wasPlaying = false;

  /** Holds the pending play promise to safely pause after seek without unhandled rejections. */
  private playPromise: Promise<void> | null = null;

  /** Subscription to user interaction events for the auto-hide feature. */
  private userInteraction$: Subscription | null = null;
  private controlsSelectorActive$: Subscription | null = null;
  private chapterChanges$: Subscription | null = null;

  /** Reference to the auto-hide timeout. Cleared when new interaction is detected. */
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Re-syncs external chapters when the `evaChapters` input changes at runtime. */
  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['evaChapters'] && !changes['evaChapters'].firstChange) {
      this.syncExternalChapters(this.evaChapters());
    }
  }

  /**
   * Starts listening for user interaction events if `hideWithControlsContainer` is enabled,
   * and initializes chapter markers.
   */
  public ngOnInit(): void {
    if (this.hideWithControlsContainer()) {
      this.startListening();
    }
    this.initChapters();
  }



  /**
   * Registers `mousemove` and `touchmove` document listeners outside Angular's zone
   * to handle seeking and hover tooltip updates without triggering change detection on every event.
   */
  public ngAfterViewInit(): void {
    const registerListeners = (): void => {
      document.addEventListener('mousemove', this.onDocumentMouseMove);
      document.addEventListener('touchmove', this.onDocumentTouchMove, { passive: true });
    };

    if (this.ngZone) {
      this.ngZone.runOutsideAngular(registerListeners);
    } else {
      registerListeners();
    }
  }

  /** Unsubscribes from all subscriptions, clears the hide timeout, and removes all document/host listeners. */
  public ngOnDestroy(): void {
    this.userInteraction$?.unsubscribe();
    this.controlsSelectorActive$?.unsubscribe();
    this.chapterChanges$?.unsubscribe();
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    document.removeEventListener('mousemove', this.onDocumentMouseMove);
    document.removeEventListener('touchmove', this.onDocumentTouchMove);
  }

  /**
   * Returns the current playback position as a percentage string (e.g. `"42%"`).
   * Used for both `aria-valuenow` and `aria-valuetext`.
   * Returns `"0%"` if total duration is not yet available.
   */
  protected getPercentage(): string {
    const time = this.evaAPI.time();
    if (!time.total) { return '0%'; }
    return `${Math.round((time.current * PERCENTAGE) / time.total)}%`;
  }

  /**
   * Returns the CSS `left` percentage for a chapter marker's start position on the scrub bar.
   *
   * @param chapter - The chapter marker to calculate the position for.
   */
  protected getChapterLeftPercent(chapter: EvaChapterMarker): string {
    const { total } = this.evaAPI.time();
    if (!total) { return '0%'; }
    return `${(chapter.startTime / total) * PERCENTAGE}%`;
  }

  /**
   * Returns the CSS `width` percentage for a chapter marker on the scrub bar,
   * calculated from its start and end times.
   *
   * @param chapter - The chapter marker to calculate the width for.
   */
  protected getChapterWidthPercent(chapter: EvaChapterMarker): string {
    const { total } = this.evaAPI.time();
    if (!total) { return '0%'; }
    return `${((chapter.endTime - chapter.startTime) / total) * PERCENTAGE}%`;
  }

  /**
   * Handles `mousedown` on the host element.
   * If sliding is enabled, begins a drag seek. Otherwise performs an immediate click-to-seek.
   * No-ops for live streams.
   */
  protected mouseDownScrub(e: MouseEvent): void {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) { return; }
    if (this.evaAPI.isLive()) { return; }

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
  protected mouseUpScrubBar(e: MouseEvent): void {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) { return; }
    if (this.evaAPI.isLive()) { return; }

    if (this.evaSlidingEnabled() && this.isSeeking) {
      this.seekEnd(this.getOffsetFromEvent(e.clientX));
    }
  }

  /**
   * Handles `touchstart` on the host element.
   * If sliding is enabled, begins a drag seek. Otherwise performs an immediate touch-to-seek.
   * No-ops for live streams.
   */
  protected touchStartScrub(e: TouchEvent): void {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) { return; }
    if (this.evaAPI.isLive()) { return; }

    if (this.evaSlidingEnabled()) {
      this.seekStart();
    } else {
      this.seekEnd(this.getTouchOffset(e));
    }
  }

  /**
   * Handles `touchcancel` on the document.
   * Ends a touch seek if one is in progress and sliding is enabled.
   * No-ops for live streams.
   */
  protected touchCancelScrub(_e: TouchEvent): void {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) { return; }
    if (this.evaAPI.isLive()) { return; }

    if (this.evaSlidingEnabled() && this.isSeeking) {
      this.touchEnd();
    }
  }

  /**
   * Handles `touchend` on the document.
   * Ends a touch seek if one is in progress and sliding is enabled.
   * No-ops for live streams.
   */
  protected touchEndScrub(_e: TouchEvent): void {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) { return; }
    if (this.evaAPI.isLive()) { return; }

    if (this.evaSlidingEnabled() && this.isSeeking) {
      this.touchEnd();
    }
  }

  /**
   * Handles `keydown` on the host element.
   * - `ArrowRight` / `ArrowUp` — seek forward via `EvaApi.seekForward()`
   * - `ArrowLeft` / `ArrowDown` — seek back via `EvaApi.seekBack()`
   * No-ops for live streams.
   */
  protected arrowAdjustTime(e: KeyboardEvent): void {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) { return; }
    if (this.evaAPI.isLive()) { return; }

    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      this.evaAPI.seekForward();
      this.emitChapterAtTime(this.evaAPI.time().current);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.evaAPI.seekBack();
      this.emitChapterAtTime(this.evaAPI.time().current);
    }
  }

  /**
 * Looks up the chapter at the given time and emits it via `onChapterChange`.
 * Emits the matching `EvaChapterMarker` if the time falls within a chapter,
 * or `null` if no chapter contains that time.
 *
 * Called after every user-initiated seek: click, drag release, touch end, and keyboard.
 *
 * @param time - The playback time in seconds to look up.
 */
  private emitChapterAtTime(time: number): void {
    const chapters = this.chapters();
    if (!chapters.length) {
      this.evaAPI.activeChapterSubject.next(null);
      return;
    }
    const chapter = chapters.find(c => time >= c.startTime && time < c.endTime) ?? null;
    this.evaAPI.activeChapterSubject.next(chapter);
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
  private readonly onDocumentMouseMove = (e: MouseEvent): void => {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) { return; }
    if (this.evaAPI.isLive()) { return; }

    // Handle seeking
    if (this.evaSlidingEnabled() && this.isSeeking) {
      this.runInZone(() => { this.seekMove(this.getOffsetFromEvent(e.clientX)); });
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
        const scrollWidth = this.elementRef.nativeElement.clientWidth;
        const percentage = Math.max(Math.min((offset * PERCENTAGE) / scrollWidth, SCRUB_BAR_MAX_SEEK_PERCENT), 0);
        const time = (percentage * this.evaAPI.time().total) / PERCENTAGE;
        const tooltipHalfWidth = SCRUB_BAR_TOOLTIP_HALF_WIDTH_PX;
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
            if (!this.evaAPI.controlsSelectorComponentActive.getValue()) {
              this.evaAPI.controlsSelectorComponentActive.next(true);
            }
          });
        }
      } else if (this.hoverTime() !== null) {
        // Mouse left the scrub bar
        this.runInZone(() => {
          this.hoverTime.set(null);
          this.hoverChapter.set(null);
          if (this.evaAPI.controlsSelectorComponentActive.getValue()) {
            this.evaAPI.controlsSelectorComponentActive.next(false);
          }
        });
      }
    }
  };

  /**
   * Document-level `touchmove` handler registered outside Angular's zone.
   * Updates `currentTime` based on touch position during an active drag seek.
   */
  private readonly onDocumentTouchMove = (e: TouchEvent): void => {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) { return; }
    if (this.evaAPI.isLive()) { return; }
    if (!this.evaSlidingEnabled() || !this.isSeeking) { return; }

    this.runInZone(() => { this.seekMove(this.getTouchOffset(e)); });
  };


  /**
   * Begins a drag seek operation.
   * Records whether the video was playing and pauses it for the duration of the seek.
   * Safely handles any pending play promise to avoid unhandled rejections.
   */
  private seekStart(): void {
    if (!this.evaAPI.canPlay()) { return; }

    this.isSeeking = true;
    this.wasPlaying = !this.evaAPI.assignedVideoElement!.paused;

    if (this.playPromise) {
      this.playPromise.then(() => {
        this.evaAPI.assignedVideoElement!.pause();
      });
    } else {
      this.evaAPI.assignedVideoElement!.pause();
    }

    this.playPromise = null;
  }

  /**
   * Updates `currentTime` during an active drag seek based on the horizontal offset.
   * Clamps the resulting percentage to `[0, SCRUB_BAR_MAX_SEEK_PERCENT]` to avoid edge-of-video issues.
   *
   * @param offsetX - Horizontal pixel offset from the left edge of the scrub bar.
   */
  private seekMove(offsetX: number): void {
    if (!this.isSeeking) { return; }

    const percentage = Math.max(
      Math.min((offsetX * PERCENTAGE) / this.elementRef.nativeElement.clientWidth, SCRUB_BAR_MAX_SEEK_PERCENT),
      0
    );
    const newTime = (percentage * this.evaAPI.time().total) / PERCENTAGE;
    if (isNaN(newTime) || newTime < 0) { return; }

    this.evaAPI.assignedVideoElement!.currentTime = newTime;
  }

  /**
   * Finalizes a seek operation. Sets `currentTime` to the target position if an offset is provided,
   * then resumes playback if the video was playing before the seek started.
   * Resets `wasPlaying` on all early-return paths to prevent the video from staying paused
   * after an invalid seek.
   *
   * @param offsetX - Horizontal pixel offset from the left edge of the scrub bar, or `false` to skip repositioning.
   */
  private seekEnd(offsetX: number | false): void {
    this.isSeeking = false;
    if (!this.evaAPI.canPlay()) {
      this.wasPlaying = false;
      return;
    }

    if (offsetX !== false) {
      const percentage = Math.max(
        Math.min((offsetX * PERCENTAGE) / this.elementRef.nativeElement.clientWidth, SCRUB_BAR_MAX_SEEK_PERCENT),
        0
      );
      const newTime = (percentage * this.evaAPI.time().total) / PERCENTAGE;
      if (isNaN(newTime) || newTime < 0) {
        this.wasPlaying = false;
        return;
      }

      this.evaAPI.assignedVideoElement!.currentTime = newTime;
      this.emitChapterAtTime(newTime);
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
  private touchEnd(): void {
    this.isSeeking = false;
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) { return; }
    this.emitChapterAtTime(this.evaAPI.assignedVideoElement!.currentTime);

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
  private initChapters(): void {
    if (!this.evaShowChapters()) { return; }
    this.syncExternalChapters(this.evaChapters());
    this.chapterChanges$ = this.evaAPI.chapterMarkerChangesSubject.subscribe((d) => {
      if (this.evaChapters().length > 0) { return; }
      this.chapters.set(d);
    });
  }

  /**
   * Syncs the `evaChapters` input to the local signal and `EvaApi.chapterMarkerChangesSubject`.
   * Sets `hasExternalChapters` when chapters are provided, clears it when they are removed
   * so VTT-parsed chapters can take over again.
   */
  protected syncExternalChapters(chapters: EvaChapterMarker[]): void {
    if (chapters.length > 0) {
      this.chapters.set(chapters);
      this.evaAPI.hasExternalChapters = true;
      this.evaAPI.chapterMarkerChangesSubject.next(chapters);
    } else if (this.evaAPI.hasExternalChapters) {
      this.evaAPI.hasExternalChapters = false;
      this.chapters.set([]);
      this.evaAPI.chapterMarkerChangesSubject.next([]);
    }
  }

  /**
   * Returns the title of the chapter active at the given time, or `null` if none.
   *
   * @param time - Time in seconds to look up.
   */
  private getChapterAtTime(time: number): string | null {
    const chapters = this.chapters();
    if (!chapters.length) { return null; }
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

    const hh = Math.floor(totalSeconds / SECONDS_PER_HOUR);
    const mm = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    const ss = totalSeconds % SECONDS_PER_MINUTE;

    const pad = (n: number): string => String(n).padStart(TIME_DISPLAY_PAD_WIDTH, '0');

    switch (format) {
      case 'HH:mm:ss': return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
      case 'mm:ss': return `${pad(mm)}:${pad(ss)}`;
      case 'ss': return `${pad(ss)}s`;
      default:
        return `${pad(ss)}s`;
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
    if (!event.touches.length) { return 0; }
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
   * Skips scheduling a hide when a selector dropdown is active to prevent the
   * bar from disappearing behind an open dropdown.
   */
  private startListening(): void {
    this.userInteraction$ = this.evaAPI.triggerUserInteraction.subscribe(() => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      if (!this.isControlerSelectorActive) {
        this.prepareHiding();
      }
    });

    this.controlsSelectorActive$ = this.evaAPI.controlsSelectorComponentActive.pipe(skip(1)).subscribe((isActive) => {
      this.isControlerSelectorActive = isActive;
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      if (!this.isControlerSelectorActive) {
        this.prepareHiding();
      }
    });
  }

  /**
   * Shows the scrub bar immediately and schedules it to hide after `evaAutohideTime` ms.
   * Any previously scheduled hide is cancelled before scheduling a new one.
   */
  private prepareHiding(): void {
    this.hideControls.set(false);
    this.hideTimeout = setTimeout(() => {
      this.hideControls.set(true);
    }, this.evaAutohideTime());
  }
}