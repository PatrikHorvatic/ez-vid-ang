import { NgModule } from "@angular/core";
import { EvaDashDirective } from "./dash.directive";
import { EvaHlsDirective } from "./hls.directive";

@NgModule({
	declarations: [EvaHlsDirective, EvaDashDirective],
	imports: [],
	exports: [EvaHlsDirective, EvaDashDirective],
	providers: []
})
export class EvaStreamingModule { }