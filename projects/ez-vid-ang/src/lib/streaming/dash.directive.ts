import { Directive, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[evaDash]',
  standalone: false,
})
export class EvaDashDirective implements OnInit, OnDestroy, OnChanges {


  ngOnChanges(_changes: SimpleChanges): void {

  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {

  }

}
