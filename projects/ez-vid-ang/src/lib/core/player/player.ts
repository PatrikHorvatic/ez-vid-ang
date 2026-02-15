import { AfterViewInit, Component, ElementRef, inject, input, OnDestroy, QueryList, viewChild, ViewChild, viewChildren } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaVideoElementConfiguration, EvaVideoSource, EvaVideoTrack } from '../../types';

@Component({
  selector: 'eva-player',
  templateUrl: './player.html',
  styleUrl: './player.scss',
  standalone: false,
  providers: [EvaApi]
})
export class EvaPlayer implements AfterViewInit, OnDestroy {
  private playerMainAPI = inject(EvaApi);

  readonly id = input.required<string>();
  readonly evaVideoSources = input.required<EvaVideoSource[]>();
  readonly evaVideoConfiguration = input<EvaVideoElementConfiguration>({});

  readonly evaVideoTracks = input<EvaVideoTrack[]>([]);
  readonly evaNotSupportedText = input<string>("I'm sorry; your browser doesn't support HTML video.");

  readonly evaVideoElement = viewChild.required<ElementRef<HTMLVideoElement>>('evaVideoElement');
  // readonly evaVideoSources = viewChildren<QueryList<HTMLSourceElement>>("evaVideoSources");
  // readonly evaVideoTracks = viewChildren<QueryList<HTMLTrackElement>>("evaVideoTracks");


  ngAfterViewInit(): void {
    this.playerMainAPI.assignElementToApi(this.evaVideoElement().nativeElement);
    this.playerMainAPI.onPlayerReady();
  }

  ngOnDestroy(): void {

  }

}
