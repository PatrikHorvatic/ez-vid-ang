import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'eva-play-pause',
  templateUrl: './play-pause.html',
  styleUrl: './play-pause.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaPlayPause {

}
