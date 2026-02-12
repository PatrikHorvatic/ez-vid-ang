import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'eva-fullscreen',
  templateUrl: './fullscreen.html',
  styleUrl: './fullscreen.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaFullscreen {

}
