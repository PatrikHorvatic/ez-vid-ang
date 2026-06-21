import { Directive, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaVideoEvent } from '../../types';
import { EvaFullscreenAPI } from '../../api/fullscreen';

/**
 * Directive that bridges native `HTMLVideoElement` media events to the `EvaApi` layer.
 *
 * Applied as an attribute on a `<video>` element:
 * ```html
 * <video evaMediaEventListeners />
 * ```
 *
 * On `ngOnInit`, all supported media events are subscribed to via `fromEvent` and
 * delegated to the corresponding `EvaApi` method. All subscriptions are cleaned up
 * in `ngOnDestroy`.
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
 * | `enterpictureinpicture` | `assignPictureInPictureWindow()` |
 * | `leavepictureinpicture` | `removePictureInPictureWindow()` |
 */
@Directive({
  selector: 'video[evaMediaEventListeners]'
})
export class EvaMediaEventListenersDirective implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);
  private fullscreenService = inject(EvaFullscreenAPI);
  private elementRef = inject(ElementRef<HTMLVideoElement>);

  private subs: Subscription[] = [];
  // private lastTapTime: number = 0;

  ngOnInit(): void {
    const el = this.elementRef.nativeElement;

    const on = (event: string, handler: (e: Event) => void) => {
      this.subs.push(fromEvent<Event>(el, event).subscribe(e => handler(e)));
    };

    on(EvaVideoEvent.CAN_PLAY, () => this.evaAPI.videoCanPlay());
    on(EvaVideoEvent.ENDED, () => this.evaAPI.endedVideo());
    on(EvaVideoEvent.ERROR, () => this.evaAPI.erroredVideo());
    on(EvaVideoEvent.LOADED_METADATA, e => this.evaAPI.loadedVideoMetadata(e));
    on(EvaVideoEvent.PAUSE, () => this.evaAPI.pauseVideo());
    on(EvaVideoEvent.PLAY, () => this.evaAPI.playVideo());
    on(EvaVideoEvent.DOUBLE_CLICK, () => this.fullscreenService.toggleFullscreen());
    on(EvaVideoEvent.PLAYING, () => this.evaAPI.playingVideo());
    on(EvaVideoEvent.PROGRESS, () => this.evaAPI.checkBufferStatus());
    on(EvaVideoEvent.RATECHANGE, e => this.evaAPI.playbackRateVideoChanged(e));
    on(EvaVideoEvent.SEEKED, () => this.evaAPI.videoSeeked());
    on(EvaVideoEvent.SEEKING, () => this.evaAPI.videoSeeking());
    on(EvaVideoEvent.STALLED, () => this.evaAPI.videoStalled());
    on(EvaVideoEvent.TIME_UPDATE, () => this.evaAPI.updateVideoTime());
    on(EvaVideoEvent.VOLUME_CHANGE, e => this.evaAPI.volumeChanged(e));
    on(EvaVideoEvent.WAITING, () => this.evaAPI.videoWaiting());
    on(EvaVideoEvent.ENTERED_PICTURE_IN_PICTURE, e => this.evaAPI.assignPictureInPictureWindow(e as PictureInPictureEvent));
    on(EvaVideoEvent.LEFT_PICTURE_IN_PICTURE, e => this.evaAPI.removePictureInPictureWindow(e as PictureInPictureEvent));

    // this.subs.push(
    //   fromEvent<TouchEvent>(el, 'touchend')
    //     .subscribe((e) => {
    //       console.log(e);
    //       const now = e.timeStamp;
    //       if (now - this.lastTapTime <= 300) {
    //         const rect = el.getBoundingClientRect();
    //         const tapX = e.changedTouches[0].clientX;
    //         if (tapX < rect.left + rect.width / 2) {
    //           this.evaAPI.seekBack(10);
    //         } else {
    //           this.evaAPI.seekForward(10);
    //         }
    //         this.lastTapTime = 0;
    //       } else {
    //         this.lastTapTime = now;
    //       }
    //     }));

  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
