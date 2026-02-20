import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { Subscription, throttleTime } from 'rxjs';

@Component({
  selector: 'eva-scrub-bar-buffering-time',
  templateUrl: './scrub-bar-buffering-time.component.html',
  styleUrl: './scrub-bar-buffering-time.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaScrubBarBufferingTimeComponent implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);

  protected bufferedPercentage: WritableSignal<string> = signal("0%");

  private bufferSubscription: Subscription | null = null;
  private timeChangeSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.bufferSubscription = this.evaAPI.videoBufferSubject.subscribe(e => {
      if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) {
        return;
      }
      this.updateBufferPercentage(this.evaAPI.assignedVideoElement.buffered);
    });

    this.timeChangeSubscription = this.evaAPI.videoTimeChangeSubject.pipe(throttleTime(2000)).subscribe(e => {
      if (!this.evaAPI.validateVideoAndPlayerBeforeAction()) {
        return;
      }
      this.updateBufferPercentage(this.evaAPI.assignedVideoElement.buffered);
    })
  }

  ngOnDestroy(): void {
    if (this.bufferSubscription) {
      this.bufferSubscription.unsubscribe();
    }
    if (this.timeChangeSubscription) {
      this.timeChangeSubscription.unsubscribe();
    }
  }

  private updateBufferPercentage(tr: TimeRanges) {
    let bufferTime = "0%";

    if (this.evaAPI.isLive()) {
      this.bufferedPercentage.set(bufferTime);
      return;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/TimeRanges/length
    // if 
    if (tr.length === 1) {
      // only one range
      if (tr.start(0) === 0 && tr.end(0) === this.evaAPI.time().total) {
        // The one range starts at the beginning and ends at
        // the end of the video, so the whole thing is loaded
        console.log("u potpunosti učitano!");

        bufferTime = "100%";
        this.bufferedPercentage.set(bufferTime);
        return;
      }
    }

    console.log("radim provjeru indexa!");
    if (tr.length - 1 >= 0) {
      console.log("ulazim u index!");
      bufferTime = (tr.end(tr.length - 1) / this.evaAPI.time().total) * 100 + "%";
    }

    this.bufferedPercentage.set(bufferTime);
  }
}
