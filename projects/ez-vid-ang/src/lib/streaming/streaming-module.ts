import { NgModule } from "@angular/core";
import { EvaHlsDirective } from "./hls.directive";
import { EvaDashDirective } from "./dash.directive";

@NgModule({
	declarations: [EvaHlsDirective, EvaDashDirective],
	imports: [],
	exports: [EvaHlsDirective, EvaDashDirective],
	providers: []
})
export class EvaStreamingModule { }