import { Directive, effect, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { EvaApi } from '../../api/eva-api';

@Directive({
  selector: 'track[evaCueChange]'
})
export class EvaCueChangeDirective implements OnDestroy {

  private el = inject<ElementRef<HTMLTrackElement>>(ElementRef);
  private evaAPI = inject(EvaApi);

  readonly evaCueChangeActive = input<boolean>(false);

  private handler: (() => void) | null = null;

  constructor() {
    effect(() => {
      const track = this.el.nativeElement.track;
      if (this.evaCueChangeActive()) {
        this.handler = () => this.evaAPI.onCueChange(track);
        track.addEventListener('cuechange', this.handler);
      } else {
        this.detach();
      }
    });
  }

  ngOnDestroy(): void {
    this.detach();
  }

  private detach(): void {
    if (this.handler) {
      this.el.nativeElement.track.removeEventListener('cuechange', this.handler);
      this.handler = null;
    }
  }

}
