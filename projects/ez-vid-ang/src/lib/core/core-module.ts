import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { EvaApi } from "../api/eva-api";
import { EvaPlayer } from "./player/player";
import { EvaControlsModule } from "../controls/controls-module";

@NgModule({
	declarations: [EvaPlayer],
	imports: [CommonModule, EvaControlsModule],
	exports: [EvaPlayer],
	providers: [EvaApi]
})
export class EvaCoreModule { }