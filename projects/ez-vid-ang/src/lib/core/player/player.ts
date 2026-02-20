import { AfterViewInit, Component, ElementRef, inject, input, OnChanges, OnDestroy, SimpleChanges, viewChild } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';
import { EvaTrack, EvaVideoElementConfiguration, EvaVideoSource } from '../../types';
import { validateTracks } from '../../utils/utilities';
import { EvaHlsDirective } from '../../streaming/hls.directive';
import { EvaDashDirective } from '../../streaming/dash.directive';

@Component({
  selector: 'eva-player',
  templateUrl: './player.html',
  styleUrl: './player.scss',
  standalone: false,
  providers: [EvaApi, EvaFullscreenAPI]
})
export class EvaPlayer implements AfterViewInit, OnChanges, OnDestroy {
  private playerMainAPI = inject(EvaApi);
  private playerFullscreenAPI = inject(EvaFullscreenAPI);

  private hlsDirective = inject(EvaHlsDirective, { optional: true });
  private dashDirective = inject(EvaDashDirective, { optional: true });

  readonly id = input.required<string>();
  readonly evaVideoSources = input.required<EvaVideoSource[]>();
  readonly evaVideoConfiguration = input<EvaVideoElementConfiguration>({});

  readonly evaVideoTracks = input<EvaTrack[], EvaTrack[]>([], { transform: validateTracks });
  readonly evaNotSupportedText = input<string>("I'm sorry; your browser doesn't support HTML video.");

  // readonly evaBuffering = viewChild<EvaBufferingComponent>('evaBuffering');

  private readonly evaVideoElement = viewChild.required<ElementRef<HTMLVideoElement>>('evaVideoElement');
  // readonly evaVideoSources = viewChildren<QueryList<HTMLSourceElement>>("evaVideoSources");
  // readonly evaVideoTrackElements = viewChildren<QueryList<HTMLTrackElement>>("evaVideoTracks");

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["evaVideoTracks"]) {
      this.playerMainAPI.videoTracksSubject.next(changes["evaVideoTracks"].currentValue);
    }
  }

  ngAfterViewInit(): void {
    this.playerMainAPI.assignElementToApi(this.evaVideoElement().nativeElement);
    this.playerMainAPI.onPlayerReady();
    console.log(this.hlsDirective);
    console.log(this.dashDirective);

  }

  ngOnDestroy(): void {

  }

}
