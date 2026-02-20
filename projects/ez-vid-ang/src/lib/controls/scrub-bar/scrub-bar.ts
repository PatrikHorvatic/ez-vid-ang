import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
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
import { transformTimeoutDuration } from '../../utils/utilities';

@Component({
  selector: 'eva-scrub-bar',
  templateUrl: './scrub-bar.html',
  styleUrl: './scrub-bar.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "slider",
    "aria-label": "scrub bar",
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
  private ngZone = inject(NgZone, { optional: true });

  readonly hideWithControlsContainer = input<boolean>(false);
  readonly evaSlidingEnabled = input<boolean>(true);
  readonly evaAutohideTime = input<number, number>(3000, { transform: transformTimeoutDuration });
  readonly evaShowTimeOnHover = input<boolean>(true);
  readonly evaTimeFormat = input<EvaTimeFormating>('mm:ss');
  readonly evaShowChapters = input<boolean>(true);
  readonly evaChapters = input<EvaChapterMarker[]>([]);

  protected hideControls: WritableSignal<boolean> = signal(false);
  protected hoverTime: WritableSignal<string | null> = signal(null);
  protected hoverChapter: WritableSignal<string | null> = signal(null);
  protected hoverLeft: WritableSignal<number> = signal(0);
  protected chapters: WritableSignal<EvaChapterMarker[]> = signal([]);

  private isSeeking = false;
  private wasPlaying = false;
  private playPromise: Promise<void> | null = null;

  private userInteraction$: Subscription | null = null;
  private hideTimeout: any;

  ngOnInit(): void {
    if (this.hideWithControlsContainer()) {
      this.startListening();
    }
    this.initChapters();
  }

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

  ngOnDestroy(): void {
    this.userInteraction$?.unsubscribe();
    if (this.hideTimeout) clearTimeout(this.hideTimeout);

    document.removeEventListener('mousemove', this.onDocumentMouseMove);
    document.removeEventListener('touchmove', this.onDocumentTouchMove);
    this.elementRef.nativeElement.removeEventListener('mousemove', this.onHostMouseMove);
    this.elementRef.nativeElement.removeEventListener('mouseleave', this.onHostMouseLeave);
  }

  protected getPercentage(): string {
    const time = this.evaAPI.time();
    if (!time.total) return '0%';
    return Math.round((time.current * 100) / time.total) + '%';
  }

  protected getChapterLeftPercent(chapter: EvaChapterMarker): string {
    const total = this.evaAPI.time().total;
    if (!total) return '0%';
    return (chapter.startTime / total) * 100 + '%';
  }

  protected getChapterWidthPercent(chapter: EvaChapterMarker): string {
    const total = this.evaAPI.time().total;
    if (!total) return '0%';
    return ((chapter.endTime - chapter.startTime) / total) * 100 + '%';
  }

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

  @HostListener('document:mouseup', ['$event'])
  protected mouseUpScrubBar(e: MouseEvent) {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;

    if (this.evaSlidingEnabled() && this.isSeeking) {
      this.seekEnd(this.getOffsetFromEvent(e.clientX));
    }
  }

  @HostListener('touchstart', ['$event'])
  protected touchStartScrub(e: TouchEvent) {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;

    if (this.evaSlidingEnabled()) {
      this.seekStart();
    } else {
      this.seekEnd(false);
    }
  }

  @HostListener('document:touchcancel', ['$event'])
  protected touchCancelScrub(e: TouchEvent) {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;

    if (this.evaSlidingEnabled() && this.isSeeking) {
      this.touchEnd();
    }
  }

  @HostListener('document:touchend', ['$event'])
  protected touchEndScrub(e: TouchEvent) {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;

    if (this.evaSlidingEnabled() && this.isSeeking) {
      this.touchEnd();
    }
  }

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

  private onDocumentTouchMove = (e: TouchEvent) => {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;
    if (!this.evaSlidingEnabled() || !this.isSeeking) return;

    this.runInZone(() => this.seekMove(this.getTouchOffset(e)));
  };

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

  private onHostMouseLeave = () => {
    this.runInZone(() => {
      this.hoverTime.set(null);
      this.hoverChapter.set(null);
    });
  };

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

  private touchEnd() {
    this.isSeeking = false;
    if (this.wasPlaying) {
      this.wasPlaying = false;
      this.evaAPI.pendingPlayAfterSeek = true;
    }
  }

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

  private getChapterAtTime(time: number): string | null {
    const chapters = this.chapters();
    if (!chapters.length) return null;
    const chapter = chapters.find(c => time >= c.startTime && time < c.endTime);
    return chapter ? chapter.title : null;
  }

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

  private getOffsetFromEvent(clientX: number): number {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    return clientX - rect.left;
  }

  private getTouchOffset(event: TouchEvent): number {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    return event.touches[0].clientX - rect.left;
  }

  private runInZone(fn: () => void): void {
    if (this.ngZone) {
      this.ngZone.run(fn);
    } else {
      fn();
    }
  }

  private startListening() {
    this.userInteraction$ = this.evaAPI.triggerUserInteraction.subscribe(() => {
      if (this.hideTimeout) clearTimeout(this.hideTimeout);
      this.prepareHiding();
    });
  }

  private prepareHiding() {
    this.hideControls.set(false);
    this.hideTimeout = setTimeout(() => {
      this.hideControls.set(true);
    }, this.evaAutohideTime());
  }
}