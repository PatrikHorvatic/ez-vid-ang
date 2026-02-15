import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { EvaApi } from "../api/eva-api";
import { EvaMediaEventListenersDirective } from './directives/media-event-listeners.directive';
import { EvaUserInteractionEventsDirective } from './directives/user-interaction-events.directive';
import { EvaVideoConfigurationDirective } from './directives/video-configuration.directive';
import { EvaPlayer } from "./player/player";

@NgModule({
	declarations: [EvaPlayer,
		EvaMediaEventListenersDirective,
		EvaVideoConfigurationDirective,
		EvaUserInteractionEventsDirective,
	],
	imports: [CommonModule],
	exports: [EvaPlayer,
		EvaMediaEventListenersDirective,
		EvaVideoConfigurationDirective,
		EvaUserInteractionEventsDirective,

	],
	providers: [EvaApi]
})
export class EvaCoreModule { }