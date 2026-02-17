import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaState } from '../../types';
import { EvaApi } from '../../api/eva-api';

@Component({
  selector: 'eva-overlay-play',
  standalone: false,
  templateUrl: './overlay-play.component.html',
  styleUrl: './overlay-play.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaOverlayPlay implements OnInit, OnDestroy {
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
  
}
