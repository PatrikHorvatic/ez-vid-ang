import { Directive, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaVideoEvent } from '../../types';

/**
 * Directive that bridges native `HTMLVideoElement` media events to the `EvaApi` layer.
 *
 * Applied as an attribute on a `<video>` element:
 * ```html
 * <video evaMediaEventListeners />
 * ```
 *
 * On `ngOnInit`, all supported media events are wrapped in RxJS `fromEvent` observables
 * and subscribed to. Each subscription delegates to the corresponding `EvaApi` method,
 * which updates internal player state (playback state, buffering, time, volume, etc.).
 * All subscriptions are cleaned up in `ngOnDestroy`.
 *
 * Events and their `EvaApi` side effects:
 * | Event             | `EvaApi` call                        |
 * |-------------------|--------------------------------------|
 * | `canplay`         | `videoCanPlay()`                     |
 * | `ended`           | `endedVideo()`                       |
 * | `error`           | `erroredVideo()`                     |
 * | `loadedmetadata`  | `loadedVideoMetadata(event)`         |
 * | `pause`           | `pauseVideo()`                       |
 * | `play`            | `playVideo()`                        |
 * | `playing`         | `playingVideo()`                     |
 * | `progress`        | `checkBufferStatus()`                |
 * | `ratechange`      | `playbackRateVideoChanged(event)`    |
 * | `seeked`          | `videoSeeked()`                      |
 * | `seeking`         | `videoSeeking()`                     |
 * | `stalled`         | `videoStalled()`                     |
 * | `timeupdate`      | `updateVideoTime()`                  |
 * | `volumechange`    | `volumeChanged(event)`               |
 * | `waiting`         | `videoWaiting()`                     |
 *
 * The following events are subscribed but currently have no `EvaApi` side effect
 * (stubs for future implementation):
 * `abort`, `canplaythrough`, `complete`, `durationchange`, `emptied`,
 * `encrypted`, `loadeddata`, `loadstart`, `suspend`, `waitingforkey`.
 *
 * @example
 * <video evaMediaEventListeners [evaVideoConfig]="config" />
 */
@Directive({
  selector: 'video[evaMediaEventListeners]',
  standalone: false,
})
export class EvaMediaEventListenersDirective implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);
  private elementRef = inject(ElementRef<HTMLVideoElement>);

  // ─── Event Observables ────────────────────────────────────────────────────
  // Each observable wraps a native media event via `fromEvent`.
  // Initialized in `ngOnInit` once the native element is available.

  private abort$: Observable<Event> | null = null;
  private canPlay$: Observable<Event> | null = null;
  private canPlayThrough$: Observable<Event> | null = null;
  private complete$: Observable<Event> | null = null;
  private durationChange$: Observable<Event> | null = null;
  private emptied$: Observable<Event> | null = null;
  private encrypted$: Observable<MediaEncryptedEvent> | null = null;
  private ended$: Observable<Event> | null = null;
  private error$: Observable<Event> | null = null;
  private loadedData$: Observable<Event> | null = null;
  private loadedMetadata$: Observable<Event> | null = null;
  private loadStart$: Observable<Event> | null = null;
  private pause$: Observable<Event> | null = null;
  private play$: Observable<Event> | null = null;
  private playing$: Observable<Event> | null = null;
  private progress$: Observable<Event> | null = null;
  /** Fires when the playback rate changes (e.g. speed selector). */
  private rateChange$: Observable<Event> | null = null;
  private seeked$: Observable<Event> | null = null;
  private seeking$: Observable<Event> | null = null;
  private stalled$: Observable<Event> | null = null;
  private suspend$: Observable<Event> | null = null;
  private timeUpdate$: Observable<Event> | null = null;
  private volumeChange$: Observable<Event> | null = null;
  private waiting$: Observable<Event> | null = null;
  private waitingForKey$: Observable<Event> | null = null;

  // ─── Subscriptions ────────────────────────────────────────────────────────
  // One subscription per event observable. All are unsubscribed in `ngOnDestroy`.

  private abortSub: Subscription | null = null;
  private canPlaySub: Subscription | null = null;
  private canPlayThroughSub: Subscription | null = null;
  private completeSub: Subscription | null = null;
  private durationChangeSub: Subscription | null = null;
  private emptiedSub: Subscription | null = null;
  private encryptedSub: Subscription | null = null;
  private endedSub: Subscription | null = null;
  private errorSub: Subscription | null = null;
  private loadedDataSub: Subscription | null = null;
  private loadedMetadataSub: Subscription | null = null;
  private loadStartSub: Subscription | null = null;
  private pauseSub: Subscription | null = null;
  private playSub: Subscription | null = null;
  private playingSub: Subscription | null = null;
  private progressSub: Subscription | null = null;
  private rateChangeSub: Subscription | null = null;
  private seekedSub: Subscription | null = null;
  private seekingSub: Subscription | null = null;
  private stalledSub: Subscription | null = null;
  private suspendSub: Subscription | null = null;
  private timeUpdateSub: Subscription | null = null;
  private volumeChangeSub: Subscription | null = null;
  private waitingSub: Subscription | null = null;
  private waitingForKeySub: Subscription | null = null;

  /**
   * Initializes all event observables from the native video element using `fromEvent`,
   * then subscribes each one and delegates to the appropriate `EvaApi` method.
   */
  ngOnInit(): void {
    this.abort$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.ABORT);
    this.canPlay$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.CAN_PLAY);
    this.canPlayThrough$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.CAN_PLAY_THROUGH);
    this.complete$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.COMPLETE);
    this.durationChange$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.DURATION_CHANGE);
    this.emptied$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.EMPTIED);
    this.encrypted$ = fromEvent<MediaEncryptedEvent>(this.elementRef.nativeElement, EvaVideoEvent.ENCRYPTED);
    this.ended$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.ENDED);
    this.error$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.ERROR);
    this.loadedData$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.LOADED_DATA);
    this.loadedMetadata$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.LOADED_METADATA);
    this.loadStart$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.LOAD_START);
    this.pause$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.PAUSE);
    this.play$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.PLAY);
    this.playing$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.PLAYING);
    this.progress$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.PROGRESS);
    this.rateChange$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.RATECHANGE);
    this.seeked$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.SEEKED);
    this.seeking$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.SEEKING);
    this.stalled$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.STALLED);
    this.suspend$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.SUSPEND);
    this.timeUpdate$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.TIME_UPDATE);
    this.volumeChange$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.VOLUME_CHANGE);
    this.waiting$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.WAITING);
    this.waitingForKey$ = fromEvent(this.elementRef.nativeElement, EvaVideoEvent.WAITING_FOR_KEY);

    /** Stub — no `EvaApi` side effect yet. */
    this.abortSub = this.abort$.subscribe(() => {
      // console.log("video aborted");
    });

    /** Notifies `EvaApi` that the video is ready to begin playback. */
    this.canPlaySub = this.canPlay$.subscribe(() => {
      // console.log("vcan playd");
      this.evaAPI.videoCanPlay();
    });

    /** Stub — no `EvaApi` side effect yet. */
    this.canPlayThroughSub = this.canPlayThrough$.subscribe(() => {
    });

    /** Stub — no `EvaApi` side effect yet. */
    this.completeSub = this.complete$.subscribe(() => {
      // console.log("video complete");
      // this.evaAPI.endedVideo();
    });

    /** Stub — no `EvaApi` side effect yet. */
    this.durationChangeSub = this.durationChange$.subscribe(() => {
    });

    /** Stub — no `EvaApi` side effect yet. */
    this.emptiedSub = this.emptied$.subscribe(() => {
    });

    /** Stub — no `EvaApi` side effect yet. */
    this.encryptedSub = this.encrypted$.subscribe(() => {
    });

    /** Notifies `EvaApi` that video playback has ended. */
    this.endedSub = this.ended$.subscribe(() => {
      // console.log("vendedd");
      this.evaAPI.endedVideo();
    });

    /** Notifies `EvaApi` that the video has encountered an error. */
    this.errorSub = this.error$.subscribe(() => {
      // console.log("video errored");
      this.evaAPI.erroredVideo();
    });

    /** Stub — no `EvaApi` side effect yet. */
    this.loadedDataSub = this.loadedData$.subscribe(() => {
      // console.log("video loaded data");
    });

    /** Notifies `EvaApi` that video metadata (duration, dimensions, tracks) has loaded. */
    this.loadedMetadataSub = this.loadedMetadata$.subscribe(v => {
      // console.log("video loaded metadata");
      this.evaAPI.loadedVideoMetadata(v)
    });

    /** Stub — no `EvaApi` side effect yet. */
    this.loadStartSub = this.loadStart$.subscribe(() => {
      // console.log("vload startd");
    });

    /** Notifies `EvaApi` that the video has been paused. */
    this.pauseSub = this.pause$.subscribe(() => {
      // console.log("video pause");
      this.evaAPI.pauseVideo();
    });

    /** Notifies `EvaApi` that the video has started playing (the `play` event, before frames render). */
    this.playSub = this.play$.subscribe(() => {
      // console.log("video play");
      this.evaAPI.playVideo();
    });

    /** Notifies `EvaApi` that the video is actively playing and rendering frames. */
    this.playingSub = this.playing$.subscribe(() => {
      // console.log("video playing");
      this.evaAPI.playingVideo();
    });

    /** Notifies `EvaApi` to check the current buffer status. */
    this.progressSub = this.progress$.subscribe(() => {
      // console.log("video progressed");
      this.evaAPI.checkBufferStatus();
    });

    /** Notifies `EvaApi` that the playback rate has changed. */
    this.rateChangeSub = this.rateChange$.subscribe(v => {
      // console.log("video rate changed");
      this.evaAPI.playbackRateVideoChanged(v);
    });

    /** Notifies `EvaApi` that a seek operation has completed. */
    this.seekedSub = this.seeked$.subscribe(() => {
      // console.log("vseekedd");
      this.evaAPI.videoSeeked();
    });

    /** Notifies `EvaApi` that a seek operation has begun. */
    this.seekingSub = this.seeking$.subscribe(() => {
      // console.log("video seeking");
      this.evaAPI.videoSeeking();
    });

    /** Notifies `EvaApi` that the browser has stalled while fetching media data. */
    this.stalledSub = this.stalled$.subscribe(() => {
      // console.log("video stalled");
      this.evaAPI.videoStalled();
    });

    /** Stub — no `EvaApi` side effect yet. */
    this.suspendSub = this.suspend$.subscribe(() => {
      // console.log("video suspended");
    });

    /** Notifies `EvaApi` to update the tracked current playback time. */
    this.timeUpdateSub = this.timeUpdate$.subscribe(() => {
      // console.log("video time updated");
      this.evaAPI.updateVideoTime();
    });

    /** Notifies `EvaApi` that the volume or mute state has changed. */
    this.volumeChangeSub = this.volumeChange$.subscribe(v => {
      this.evaAPI.volumeChanged(v);
    });

    /** Notifies `EvaApi` that the video is waiting for data before it can continue playback. */
    this.waitingSub = this.waiting$.subscribe(() => {
      // console.log("video waiting");
      this.evaAPI.videoWaiting();
    });

    /** Stub — no `EvaApi` side effect yet. */
    this.waitingForKeySub = this.waitingForKey$.subscribe(() => {
      // console.log("video waiting for key");
    });
  }

  /** Unsubscribes all event subscriptions to prevent memory leaks. */
  ngOnDestroy(): void {
    this.abortSub?.unsubscribe();
    this.canPlaySub?.unsubscribe();
    this.canPlayThroughSub?.unsubscribe();
    this.completeSub?.unsubscribe();
    this.durationChangeSub?.unsubscribe();
    this.emptiedSub?.unsubscribe();
    this.encryptedSub?.unsubscribe();
    this.endedSub?.unsubscribe();
    this.errorSub?.unsubscribe();
    this.loadedDataSub?.unsubscribe();
    this.loadedMetadataSub?.unsubscribe();
    this.loadStartSub?.unsubscribe();
    this.pauseSub?.unsubscribe();
    this.playSub?.unsubscribe();
    this.playingSub?.unsubscribe();
    this.progressSub?.unsubscribe();
    this.rateChangeSub?.unsubscribe();
    this.seekedSub?.unsubscribe();
    this.seekingSub?.unsubscribe();
    this.stalledSub?.unsubscribe();
    this.suspendSub?.unsubscribe();
    this.timeUpdateSub?.unsubscribe();
    this.volumeChangeSub?.unsubscribe();
    this.waitingSub?.unsubscribe();
    this.waitingForKeySub?.unsubscribe();
  }
}