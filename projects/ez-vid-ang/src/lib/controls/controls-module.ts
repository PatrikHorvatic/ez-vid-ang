import { NgModule } from "@angular/core";
import { EvaControlsContainerComponent } from './eva-controls-container/controls-container.component';
import { EvaFullscreen } from "./fullscreen/fullscreen";
import { EvaMute } from "./mute/mute";
import { EvaOverlayPlay } from './overlay-play/overlay-play.component';
import { EvaTimeDisplayPipe } from "./pipes/time-display-pipe";
import { EvaPlayPause } from "./play-pause/play-pause";
import { EvaPlaybackSpeed } from "./playback-speed/playback-speed";
import { EvaQualitySelector } from "./quality-selector/quality-selector";
import { EvaScrubBarBufferingTimeComponent } from './scrub-bar-buffering-time/scrub-bar-buffering-time.component';
import { EvaScrubBarCurrentTimeComponent } from './scrub-bar-current-time/scrub-bar-current-time.component';
import { EvaScrubBar } from "./scrub-bar/scrub-bar";
import { EvaTimeDisplay } from "./time-display/time-display";
import { EvaTrackSelector } from "./track-selector/track-selector";
import { EvaVolume } from "./volume/volume";
import { EvaForwardComponent } from './forward/forward.component';
import { EvaBackwardComponent } from './backward/backward.component';


@NgModule({
	declarations: [EvaFullscreen, EvaMute, EvaPlayPause,
		EvaPlaybackSpeed, EvaQualitySelector, EvaScrubBar,
		EvaTimeDisplay, EvaTrackSelector, EvaVolume,
		EvaTimeDisplayPipe,
		EvaControlsContainerComponent,
		EvaOverlayPlay,
		EvaScrubBarBufferingTimeComponent,
		EvaScrubBarCurrentTimeComponent,
		EvaForwardComponent,
		EvaBackwardComponent],
	imports: [],
	exports: [EvaFullscreen, EvaMute, EvaPlayPause,
		EvaPlaybackSpeed, EvaQualitySelector, EvaScrubBar,
		EvaControlsContainerComponent,
		EvaTimeDisplayPipe, EvaOverlayPlay,
		EvaTimeDisplay, EvaTrackSelector, EvaVolume,
		EvaScrubBarCurrentTimeComponent,
		EvaScrubBarBufferingTimeComponent,
		EvaForwardComponent,
		EvaBackwardComponent
	],
	providers: []
})
export class EvaControlsModule { }