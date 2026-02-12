import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'eva-volume',
  templateUrl: './volume.html',
  styleUrl: './volume.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaVolume {
}
