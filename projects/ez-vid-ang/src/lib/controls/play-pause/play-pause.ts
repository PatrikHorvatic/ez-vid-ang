import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { EvaApi } from '../../api/eva-api';

@Component({
  selector: 'eva-play-pause',
  templateUrl: './play-pause.html',
  styleUrl: './play-pause.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[class.icon]": "true",
    "[class.eva-icon-pause]": "true",
    "(click)": "playPauseClicked()"
  }
})
export class EvaPlayPause implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);

  ngOnInit(): void {

  }

  ngOnDestroy(): void {

  }

  protected playPauseClicked() {
    this.evaAPI.playOrPauseVideo();
  }

}
