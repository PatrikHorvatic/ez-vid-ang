import { AfterViewInit, Component, ElementRef, inject, input, OnChanges, OnDestroy, QueryList, SimpleChanges, viewChild, viewChildren } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaTrack, EvaVideoElementConfiguration, EvaVideoSource } from '../../types';
import { validateTracks } from '../../utils/utilities';

@Component({
  selector: 'eva-player',
  templateUrl: './player.html',
  styleUrl: './player.scss',
  standalone: false,
  providers: [EvaApi]
})
export class EvaPlayer implements AfterViewInit, OnChanges, OnDestroy {
  private playerMainAPI = inject(EvaApi);

  readonly id = input.required<string>();
  readonly evaVideoSources = input.required<EvaVideoSource[]>();
  readonly evaVideoConfiguration = input<EvaVideoElementConfiguration>({});

  readonly evaVideoTracks = input<EvaTrack[], EvaTrack[]>([], { transform: validateTracks });
  readonly evaNotSupportedText = input<string>("I'm sorry; your browser doesn't support HTML video.");

  readonly evaVideoElement = viewChild.required<ElementRef<HTMLVideoElement>>('evaVideoElement');
  // readonly evaVideoSources = viewChildren<QueryList<HTMLSourceElement>>("evaVideoSources");
  readonly evaVideoTrackElements = viewChildren<QueryList<HTMLTrackElement>>("evaVideoTracks");

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["evaVideoTracks"]) {
      this.playerMainAPI.videoTracksSubject.next(changes["evaVideoTracks"].currentValue);
    }
  }

  ngAfterViewInit(): void {
    this.playerMainAPI.assignElementToApi(this.evaVideoElement().nativeElement);
    this.playerMainAPI.onPlayerReady();
  }

  ngOnDestroy(): void {

  }

}
