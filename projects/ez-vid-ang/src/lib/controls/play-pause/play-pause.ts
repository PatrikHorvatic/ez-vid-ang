import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { Subscription } from 'rxjs';
import { EvaState } from '../../types';

@Component({
  selector: 'eva-play-pause',
  templateUrl: './play-pause.html',
  styleUrl: './play-pause.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[class.eva-icon]": "true",
    "[class.eva-icon-pause]": "playingState() === 'playing'",
    "[class.eva-icon-play_arrow]": "playingState() === 'loading' || playingState() === 'paused' || playingState() === 'ended' || playingState() === 'error'",
    "(click)": "playPauseClicked()",
    "(keydown)": "playPauseClickedKeyboard($event)"
  }
})
export class EvaPlayPause implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);

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
