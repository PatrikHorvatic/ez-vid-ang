import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaState } from '../../types';
import { EvaPlayPauseAria, EvaPlayPauseAriaTransformed, transformEvaPlayPauseAria } from '../../utils/aria-utilities';

@Component({
  selector: 'eva-play-pause',
  templateUrl: './play-pause.html',
  styleUrl: './play-pause.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "ariaLabel()",
    "[attr.aria-valuetext]": "ariaValueText()",
    "[class.eva-icon]": "true",
    "[class.eva-icon-pause]": "playingState() === 'playing'",
    "[class.eva-icon-play_arrow]": "playingState() === 'loading' || playingState() === 'paused' || playingState() === 'ended' || playingState() === 'error'",
    "(click)": "playPauseClicked()",
    "(keydown)": "playPauseClickedKeyboard($event)"
  }
})
export class EvaPlayPause implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);

  // TODO - not the coolest solution, try to utilize type inference. these 2 transform functions are ugly
  readonly evaPlayPauseAria = input<EvaPlayPauseAriaTransformed, EvaPlayPauseAria | undefined>(
    transformEvaPlayPauseAria(undefined),
    { transform: transformEvaPlayPauseAria }
  );

  protected ariaLabel = computed<string>(() => {
    return this.playingState() === 'playing' ? this.evaPlayPauseAria().ariaLabel!.play! : this.evaPlayPauseAria().ariaLabel?.pause!;
  });

  protected ariaValueText = computed<string>(() => {
    if (this.playingState() === "loading") {
      return this.evaPlayPauseAria().ariaValueText?.loading!;
    }
    else if (this.playingState() === "playing") {
      return this.evaPlayPauseAria().ariaValueText?.playing!;
    }
    else if (this.playingState() === "paused") {
      return this.evaPlayPauseAria().ariaValueText?.paused!;
    }
    else if (this.playingState() === "ended") {
      return this.evaPlayPauseAria().ariaValueText?.ended!;
    }
    else if (this.playingState() === "error") {
      return this.evaPlayPauseAria().ariaValueText?.errored!;
    }
    else {
      return "loading";
    }
  })

  protected playingState!: WritableSignal<EvaState>;
  private playingStateSub: Subscription | null = null;

  ngOnInit(): void {
    this.playingState = signal(this.evaAPI.getCurrentVideoState());
    this.playingStateSub = this.evaAPI.videoStateSubject.subscribe(state => {
      this.playingState.set(state);
    })
  }

  ngOnDestroy(): void {
    this.playingStateSub?.unsubscribe();
  }

  protected playPauseClicked() {
    this.evaAPI.playOrPauseVideo();
  }

  protected playPauseClickedKeyboard(k: KeyboardEvent) {
    // On press Enter (13) or Space (32)
    if (k.keyCode === 13 || k.keyCode === 32) {
      k.preventDefault();
      this.playPauseClicked();
    }
  }

}
