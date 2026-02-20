import {
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
import { EvaTimeFormating } from '../../types';
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
export class EvaScrubBar implements OnInit, OnDestroy {
  protected evaAPI = inject(EvaApi);
  private elementRef = inject(ElementRef<HTMLElement>);
  private ngZone = inject(NgZone);

  readonly hideWithControlsContainer = input<boolean>(false);
  readonly evaSlidingEnabled = input<boolean>(true);
  readonly evaAutohideTime = input<number, number>(3000, { transform: transformTimeoutDuration });
  readonly evaShowTimeOnHover = input<boolean>(true);
  readonly evaTimeFormat = input<EvaTimeFormating>('mm:ss');

  protected hideControls: WritableSignal<boolean> = signal(false);
  protected hoverTime: WritableSignal<string | null> = signal(null);
  protected hoverLeft: WritableSignal<number> = signal(0);

  private isSeeking = false;
  private wasPlaying = false;
  private playPromise: Promise<void> | null = null;

  private userInteraction$: Subscription | null = null;
  private hideTimeout: any;



  ngOnInit(): void {
    if (this.hideWithControlsContainer()) {
      this.startListening();
    }

    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('mousemove', this.onDocumentMouseMove);
      document.addEventListener('touchmove', this.onDocumentTouchMove, { passive: true });
    });
  }

  ngOnDestroy(): void {
    this.userInteraction$?.unsubscribe();
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    document.removeEventListener('mousemove', this.onDocumentMouseMove);
    document.removeEventListener('touchmove', this.onDocumentTouchMove);
  }

  protected getPercentage(): string {
    const time = this.evaAPI.time();
    if (!time.total) return '0%';
    return Math.round((time.current * 100) / time.total) + '%';
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

  private onDocumentMouseMove = (e: MouseEvent) => {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;

    if (this.evaSlidingEnabled() && this.isSeeking) {
      // Only re-enter zone when actually seeking
      this.ngZone.run(() => {
        this.seekMove(this.getOffsetFromEvent(e.clientX));
      });
    }

    if (this.evaShowTimeOnHover()) {
      const offset = this.getOffsetFromEvent(e.clientX);
      const rect = this.elementRef.nativeElement.getBoundingClientRect();

      const percentage = Math.max(
        Math.min((offset * 100) / this.elementRef.nativeElement.scrollWidth, 99.9),
        0
      );
      const time = (percentage * this.evaAPI.time().total) / 100;

      const tooltipHalfWidth = 35;
      const clampedLeft = Math.max(tooltipHalfWidth, Math.min(offset, rect.width - tooltipHalfWidth));
      this.ngZone.run(() => {
        this.hoverTime.set(this.formatTime(time));
        this.hoverLeft.set(clampedLeft);
      });
    }
  };

  private onDocumentTouchMove = (e: TouchEvent) => {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;

    if (this.evaSlidingEnabled() && this.isSeeking) {
      this.ngZone.run(() => {
        this.seekMove(this.getTouchOffset(e));
      });
    }
  };

  @HostListener('document:mouseup', ['$event'])
  protected mouseUpScrubBar(e: MouseEvent) {
    if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) return;
    if (this.evaAPI.isLive()) return;

    if (this.evaSlidingEnabled() && this.isSeeking) {
      this.seekEnd(this.getOffsetFromEvent(e.clientX));
    }
  }

  @HostListener('mouseleave')
  protected mouseLeave() {
    this.hoverTime.set(null);
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

  private formatTime(seconds: number): string {
    const format = this.evaTimeFormat();
    const totalSeconds = Math.floor(seconds);

    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    switch (format) {
      case 'HH:mm:ss':
        return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
      case 'mm:ss':
        return `${pad(mm)}:${pad(ss)}`;
      case 'ss':
        return `${pad(ss)}s`;
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