# Example configuration

Here you can see how you can configure your Eva video player. All of the components are documented.

```html
<eva-player #evaVideoPlayer [id]="'vid'" [evaVideoSources]="[]" [evaVideoConfiguration]="videoConfiguration()"
	[evaVideoTracks]="videoTracks()" evaHls [evaHlsSrc]="hlsSource()">
	<eva-overlay-play [evaCustomIcon]="true">
		<p>Overlay play custom content</p>
	</eva-overlay-play>

	<eva-buffering [defaultSpinner]="false">
		<p>Custom spinner here</p>
	</eva-buffering>

	<eva-scrub-bar [evaShowTimeOnHover]="true" [evaShowChapters]="true" [hideWithControlsContainer]="true">
		<eva-scrub-bar-buffering-time />
		<eva-scrub-bar-current-time />
	</eva-scrub-bar>

	<eva-subtitle-display />

	<eva-controls-container evaUserInteractionEvents [evaAutohide]="true">
		<eva-play-pause [evaCustomIcon]="false">
			<p evaPlay>Play</p>
			<p evaPause>Pause</p>
		</eva-play-pause>

		<eva-active-chapter />

		<eva-mute [evaCustomIcon]="false" [evaAria]="ariaMute()">
			<p evaVolumeOff>Off</p>
			<p evaVolumeLow>Low</p>
			<p evaVolumeMiddle>Middle</p>
			<p evaVolumeUp>Up</p>
		</eva-mute>
		<eva-volume />
		<eva-playback-speed [evaPlaybackSpeeds]="[0.5,1.0,2.0,4.0]" />
		<eva-time-display evaTimeProperty="current" evaTimeFormating="HH:mm:ss" />

		<eva-controls-divider />

		<eva-time-display evaTimeProperty="remaining" evaTimeFormating="HH:mm:ss" />
		<eva-track-selector />
		<eva-time-display evaTimeProperty="total" evaTimeFormating="HH:mm:ss" />
		<eva-fullscreen />
		<eva-quality-selector />

		<eva-forward />
		<eva-backward />

	</eva-controls-container>

</eva-player>
```


```typescript

import { AfterViewInit, Component, signal, viewChild, WritableSignal } from '@angular/core';
import {
  EvaActiveChapter,
  EvaBackward,
  EvaBuffering,
  EvaOverlayPlay,
  EvaChapterMarker,
  EvaControlsContainer, EvaControlsDivider,
  EvaForward, EvaFullscreen, EvaHlsDirective,
  EvaMute, EvaMuteAria, EvaPlaybackSpeed, EvaPlayer,
  EvaPlayPause, EvaQualitySelector, EvaScrubBar,
  EvaScrubBarBufferingTime, EvaScrubBarCurrentTime,
  EvaSubtitleDisplay,
  EvaTimeDisplay, EvaTrack, EvaTrackSelector,
  EvaVideoElementConfiguration, EvaVideoSource, EvaVolume
} from "ez-vid-ang";

@Component({
  selector: 'lt-testing-page',
  templateUrl: './testing-page.html',
  styleUrl: `./testing-page.scss`,
  standalone: true,
  imports: [EvaActiveChapter,
    EvaBackward,
    EvaBuffering,
    EvaOverlayPlay,
    EvaControlsContainer,
    EvaControlsDivider,
    EvaForward,
    EvaFullscreen,
    EvaHlsDirective,
    EvaMute,
    EvaPlaybackSpeed,
    EvaPlayer,
    EvaPlayPause,
    EvaQualitySelector,
    EvaScrubBar,
    EvaScrubBarBufferingTime,
    EvaScrubBarCurrentTime,
    EvaSubtitleDisplay,
    EvaTimeDisplay,
    EvaTrackSelector,
    EvaVolume]
})
export class TestingPage implements AfterViewInit {

  readonly evaPlayer = viewChild.required<EvaPlayer>('evaVideoPlayer');

  protected videoSources: WritableSignal<EvaVideoSource[]> = signal([{
    type: "",
    src: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    // src: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8",
    // src: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8",
  }]);

  protected hlsSource = signal("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");

  protected chapters: WritableSignal<EvaChapterMarker[]> = signal([
    { startTime: 0, endTime: 90, title: 'Intro' },
    { startTime: 90, endTime: 180, title: 'Background & Context' },
    { startTime: 180, endTime: 300, title: 'Main Topic' },
    { startTime: 300, endTime: 420, title: 'Deep Dive' },
    { startTime: 420, endTime: 540, title: 'Examples & Demo' },
    { startTime: 540, endTime: 600, title: 'Conclusion' },
  ]);

  protected ariaMute: WritableSignal<EvaMuteAria> = signal({

  })

  protected videoTracks: WritableSignal<EvaTrack[]> = signal([
    {
      kind: "subtitles",
      srclang: "EN",
      label: "EN",
      src: "subs.vtt",
    },
    {
      kind: "subtitles",
      srclang: "HR",
      label: "HR",
      src: "subs.vtt",
    },
    {
      kind: "chapters",
      src: "chapters.vtt",
      srclang: "HR",
      label: "Chapters"
    }
  ]);

  protected videoConfiguration: WritableSignal<EvaVideoElementConfiguration> = signal({
    autoplay: false,
    controls: false,
    crossorigin: "anonymous",
    disablePictureInPicture: false,
    preload: "auto",
    // width: 600,
    // height: 400
  })

  ngAfterViewInit(): void {
    console.log(this.evaPlayer());
  }
}


```