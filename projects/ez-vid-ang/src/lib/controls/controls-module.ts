import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { EvaControlsContainerComponent } from './eva-controls-container/controls-container.component';
import { EvaFullscreen } from "./fullscreen/fullscreen";
import { EvaMute } from "./mute/mute";
import { EvaPlayPause } from "./play-pause/play-pause";
import { EvaPlaybackSpeed } from "./playback-speed/playback-speed";
import { EvaQualitySelector } from "./quality-selector/quality-selector";
import { EvaScrubBar } from "./scrub-bar/scrub-bar";
import { EvaTimeDisplay } from "./time-display/time-display";
import { EvaTrackSelector } from "./track-selector/track-selector";
import { EvaVolume } from "./volume/volume";
import { EvaTimeDisplayPipe } from "./pipes/time-display-pipe";


@NgModule({
	declarations: [EvaFullscreen, EvaMute, EvaPlayPause,
		EvaPlaybackSpeed, EvaQualitySelector, EvaScrubBar,
		EvaTimeDisplay, EvaTrackSelector, EvaVolume,
		EvaTimeDisplayPipe,
		EvaControlsContainerComponent],
	imports: [CommonModule],
	exports: [EvaFullscreen, EvaMute, EvaPlayPause,
		EvaPlaybackSpeed, EvaQualitySelector, EvaScrubBar,
		EvaControlsContainerComponent,
		EvaTimeDisplayPipe,
		EvaTimeDisplay, EvaTrackSelector, EvaVolume],
	providers: []
})
export class EvaControlsModule { }