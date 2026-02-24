import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, WritableSignal } from "@angular/core";
import { EvaApi } from "../../api/eva-api";
import { Subscription } from "rxjs";

@Component({
  selector: "eva-subtitle-display",
  templateUrl: "./subtitle-display.component.html",
  styleUrl: "./subtitle-display.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class.eva-subtitle-display]": "true",
    "[class.eva-subtitle-display--visible]": "cue() !== null",
    "[style.padding-bottom]": "controlsCointainerNotVisible() ? '8px' : 'calc(var(--eva-control-element-height) + var(--eva-scrub-bar-heights) + 12px)'"
  }
})
export class EvaSubtitleDisplayComponent implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);
  protected readonly cue = this.evaAPI.currentSubtitleCue;

  protected controlsCointainerNotVisible: WritableSignal<boolean> = signal(false);
  private controlsVisibiliti$: Subscription | null = null;

  ngOnInit(): void {
    this.controlsVisibiliti$ = this.evaAPI.componentsContainerVisibilityStateSubject.subscribe((a) => {
      this.controlsCointainerNotVisible.set(a);
    });
  }


  ngOnDestroy(): void {
    this.controlsVisibiliti$?.unsubscribe();
  }
}
