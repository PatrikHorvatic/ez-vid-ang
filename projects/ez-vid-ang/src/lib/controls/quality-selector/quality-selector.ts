import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { EvaQualityAria } from '../../utils/aria-utilities';
import { EvaApi } from '../../api/eva-api';
import { EvaQualityLevel } from '../../types';

// TODO - Prije implementirati streaming direktive
@Component({
  selector: 'eva-quality-selector',
  templateUrl: './quality-selector.html',
  styleUrl: './quality-selector.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "ariaLabel()",
    "attr.aria-valuetext": "Quality",
  }
})
export class EvaQualitySelector implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);

  readonly evaQualitySelectorText = input<string>("Quality selector");
  readonly evaQualityAutoText = input<string>("Auto");

  readonly evaQualities = input.required<Array<EvaQualityLevel>>();

  readonly evaAria = input<EvaQualityAria>({ ariaLabel: "Quality selector" });

  protected ariaLabel = computed<string>(() => {
    return this.evaAria() && this.evaAria().ariaLabel ? this.evaAria().ariaLabel! : "Quality selector";
  });

  protected isOpen = signal(false);


  ngOnInit(): void {

  }

  ngOnDestroy(): void {

  }

}
