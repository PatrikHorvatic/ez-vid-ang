import { Directive, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[evaHls]',
  standalone: false,
})
export class EvaHlsDirective implements OnInit, OnDestroy, OnChanges {

  ngOnChanges(changes: SimpleChanges): void {

  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {

  }
}
