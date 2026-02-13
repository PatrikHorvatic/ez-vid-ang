import { Directive, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Observable, Subscription } from 'rxjs';
import { EvaVideoEvent } from '../../types';
import { EvaApi } from '../../api/eva-api';

@Directive({
  selector: 'video[evaMediaEventListeners]',
  standalone: false,
})
export class EvaMediaEventListenersDirective implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);
  private elementRef = inject(ElementRef<HTMLVideoElement>);

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
  private rateChange$: Observable<Event> | null = null;
  private seeked$: Observable<Event> | null = null;
  private seeking$: Observable<Event> | null = null;
  private stalled$: Observable<Event> | null = null;
  private suspend$: Observable<Event> | null = null;
  private timeUpdate$: Observable<Event> | null = null;
  private volumeChange$: Observable<Event> | null = null;
  private waiting$: Observable<Event> | null = null;
  private waitingForKey$: Observable<Event> | null = null;

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

    this.abortSub = this.abort$.subscribe(v => {

    });
    this.canPlaySub = this.canPlay$.subscribe(v => {

    });
    this.canPlayThroughSub = this.canPlayThrough$.subscribe(v => {

    });
    this.completeSub = this.complete$.subscribe(v => {

    });
    this.durationChangeSub = this.durationChange$.subscribe(v => {

    });
    this.emptiedSub = this.emptied$.subscribe(v => {

    });
    this.encryptedSub = this.encrypted$.subscribe(v => {

    });
    this.endedSub = this.ended$.subscribe(v => {
      this.evaAPI.endedVideo();
    });
    this.errorSub = this.error$.subscribe(v => {
      this.evaAPI.erroredVideo();
    });
    this.loadedDataSub = this.loadedData$.subscribe(v => {

    });
    this.loadedMetadataSub = this.loadedMetadata$.subscribe(v => {

    });
    this.loadStartSub = this.loadStart$.subscribe(v => {

    });
    this.pauseSub = this.pause$.subscribe(v => {
      this.evaAPI.pauseVideo();
    });
    this.playSub = this.play$.subscribe(v => {
      this.evaAPI.playVideo();
    });
    this.playingSub = this.playing$.subscribe(v => {
      this.evaAPI.playingVideo();
    });
    this.progressSub = this.progress$.subscribe(v => {

    });
    this.rateChangeSub = this.rateChange$.subscribe(v => {

    });
    this.seekedSub = this.seeked$.subscribe(v => {

    });
    this.seekingSub = this.seeking$.subscribe(v => {

    });
    this.stalledSub = this.stalled$.subscribe(v => {

    });
    this.suspendSub = this.suspend$.subscribe(v => {

    });
    this.timeUpdateSub = this.timeUpdate$.subscribe(v => {

    });
    this.volumeChangeSub = this.volumeChange$.subscribe(v => {
      console.log("VOLUME CHANGED:");
      console.log(v);
      this.evaAPI.volumeChanged(v);

    });
    this.waitingSub = this.waiting$.subscribe(v => {

    });
    this.waitingForKeySub = this.waitingForKey$.subscribe(v => {

    });
  }

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
