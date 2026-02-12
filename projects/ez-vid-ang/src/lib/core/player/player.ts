import { AfterViewInit, Component, ContentChildren, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaVideoElementConfiguration, EvaVideoSource, EvaVideoTrack } from '../../types';
import { videoConfigurationDefaultSetter, videoSourceDefaultSetter, videoTrackDefaultSetter } from '../../utils/utilities';
import { EvaFullscreen } from '../../controls/fullscreen/fullscreen';
import { EvaMute, EvaPlaybackSpeed, EvaPlayPause, EvaQualitySelector, EvaScrubBar, EvaTimeDisplay, EvaTrackSelector, EvaVolume } from '../../../public-api';

@Component({
  selector: 'eva-player',
  templateUrl: './player.html',
  styleUrl: './player.scss',
  standalone: false,
  providers: [EvaApi]
})
export class EvaPlayer implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) id!: string;
  @Input({ required: true, transform: videoSourceDefaultSetter }) videoSources!: Array<EvaVideoSource>;
  @Input({ required: false, transform: videoConfigurationDefaultSetter }) videoConfiguration!: EvaVideoElementConfiguration;

  @Input({ required: false, transform: videoTrackDefaultSetter }) videoTracks: Array<EvaVideoTrack> | undefined;
  @Input({ required: false }) notSupportedText: string = "I'm sorry; your browser doesn't support HTML video.";

  @ViewChild('evaVideoElement', { static: true }) evaVideoElement!: ElementRef<HTMLVideoElement>;
  @ViewChildren('evaVideoSources') evaVideoSourceElements!: QueryList<HTMLSourceElement>;
  @ViewChildren('evaVideoTracks') evaVideoTrackElements!: QueryList<HTMLTrackElement>;

  @ContentChildren(EvaFullscreen, { descendants: true }) evaFullscreen!: QueryList<EvaFullscreen>;
  @ContentChildren(EvaMute, { descendants: true }) evaMute!: QueryList<EvaMute>;
  @ContentChildren(EvaPlayPause, { descendants: true }) evaPlayPause!: QueryList<EvaPlayPause>;
  @ContentChildren(EvaPlaybackSpeed, { descendants: true }) evaPlaybackSpeed!: QueryList<EvaPlaybackSpeed>;
  @ContentChildren(EvaQualitySelector, { descendants: true }) evaQualitySelector!: QueryList<EvaQualitySelector>;
  @ContentChildren(EvaScrubBar, { descendants: true }) evaScrubBar!: QueryList<EvaScrubBar>;
  @ContentChildren(EvaTimeDisplay, { descendants: true }) evaTimeDisplay!: QueryList<EvaTimeDisplay>;
  @ContentChildren(EvaTrackSelector, { descendants: true }) evaTrackSelector!: QueryList<EvaTrackSelector>;
  @ContentChildren(EvaVolume, { descendants: true }) evaVolume!: QueryList<EvaVolume>;

  constructor(public playerMainAPI: EvaApi) { }


  ngOnInit(): void {
    console.log(this.playerMainAPI);
  }

  ngAfterViewInit(): void {
    this.prepareVideoBasedOnTheConfiguration();
    console.log(this.evaVideoElement);
    console.log(this.evaVideoSourceElements);
    console.log(this.evaVideoTrackElements);
    console.log(this.evaFullscreen);
  }

  ngOnDestroy(): void {
    console.log(this.playerMainAPI);
  }

  private prepareVideoBasedOnTheConfiguration() {
    if (this.evaVideoElement) {
      //   this.evaVideoElement.nativeElement.width = this.videoConfiguration.width!;

      if (this.videoConfiguration.autoplay) {
        this.evaVideoElement.nativeElement.autoplay = this.videoConfiguration.autoplay;
      }
      if (this.videoConfiguration.controls) {
        this.evaVideoElement.nativeElement.controls = this.videoConfiguration.controls;
      }
      // TODO - Figure out how to add controlslist. It exists according to the docs: 
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video#controlslist
      // But typescript complains :/

      // if (this.videoConfiguration.controlsList) {
      //   this.evaVideoElement.nativeElement["controlslist"] = this.videoConfiguration.controlsList;
      // }
      if (this.videoConfiguration.crossorigin) {
        this.evaVideoElement.nativeElement.crossOrigin = this.videoConfiguration.crossorigin;
      }
      if (this.videoConfiguration.disablePictureInPicture) {
        this.evaVideoElement.nativeElement.disablePictureInPicture = this.videoConfiguration.disablePictureInPicture;
      }
      if (this.videoConfiguration.disableRemotePlayback) {
        this.evaVideoElement.nativeElement.disableRemotePlayback = this.videoConfiguration.disableRemotePlayback;
      }
      if (this.videoConfiguration.loop) {
        this.evaVideoElement.nativeElement.loop = this.videoConfiguration.loop;
      }
      if (this.videoConfiguration.muted) {
        this.evaVideoElement.nativeElement.muted = this.videoConfiguration.muted;
      }
      if (this.videoConfiguration.playinline) {
        this.evaVideoElement.nativeElement.playsInline = this.videoConfiguration.playinline;
      }
      if (this.videoConfiguration.poster) {
        this.evaVideoElement.nativeElement.poster = this.videoConfiguration.poster;
      }
      if (this.videoConfiguration.preload) {
        this.evaVideoElement.nativeElement.preload = this.videoConfiguration.preload;
      }
    }
  }

}
