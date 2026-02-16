import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit } from '@angular/core';
import { EvaApi } from '../../api/eva-api';

@Component({
  selector: 'eva-buffering',
  templateUrl: './buffering.component.html',
  styleUrl: './buffering.component.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class.eva-display-buffering]": "evaAPI.isBuffering()"
  }
})
export class EvaBufferingComponent implements OnInit, OnDestroy {

  protected evaAPI = inject(EvaApi);

  readonly defaultSpinner = input<boolean>(true);


  ngOnInit(): void {

  }

  ngOnDestroy(): void {

  }
}
