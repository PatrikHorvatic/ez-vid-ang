import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaState } from '../../types';
import { EvaOverlayPlayAria, EvaOverlayPlayAriaTransformed, transformEvaOverlayPlayAria } from '../../utils/aria-utilities';

@Component({
  selector: 'eva-overlay-play',
  standalone: false,
  templateUrl: './overlay-play.component.html',
  styleUrl: './overlay-play.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "[attr.aria-label]": "ariaLabel()",
    "[class.eva-icon]": "!evaCustomIcon()",
    "[class.eva-icon-play_arrow]": "!evaCustomIcon() && evaIconPlay()",
    "[class.eva-display-overlay-play]": "evaIconPlay() && !evaAPI.isBuffering()",
    "(click)": "playClicked()",
    "(keydown)": "playClickedKeyboard($event)"
  }
})
export class EvaOverlayPlay implements OnInit, OnDestroy {
  protected evaAPI = inject(EvaApi);

  readonly evaOvelayPlayAria = input<EvaOverlayPlayAriaTransformed, EvaOverlayPlayAria>(transformEvaOverlayPlayAria(undefined), { transform: transformEvaOverlayPlayAria });
  readonly evaCustomIcon = input<boolean>(false);

  protected ariaLabel = computed<string>(() => {
    return this.evaOvelayPlayAria().ariaLabel;
  });

  protected evaIconPlay = computed<boolean>(() => {
    return this.playingState() === 'loading' || this.playingState() === 'paused' || this.playingState() === 'ended' || this.playingState() === 'error';
  })

  protected playingState: WritableSignal<EvaState> = signal(this.evaAPI.getCurrentVideoState());
  private playingStateSub: Subscription | null = null;

  ngOnInit(): void {
    this.playingStateSub = this.evaAPI.videoStateSubject.subscribe(state => {
      console.log(state);

      this.playingState.set(state);
    })
  }

  ngOnDestroy(): void {
    this.playingStateSub?.unsubscribe();
  }

  protected playClicked() {
    this.evaAPI.playOrPauseVideo();
  }

  protected playClickedKeyboard(k: KeyboardEvent) {
    // On press Enter (13) or Space (32)
    if (k.keyCode === 13 || k.keyCode === 32) {
      k.preventDefault();
      this.playClicked();
    }
  }

}
