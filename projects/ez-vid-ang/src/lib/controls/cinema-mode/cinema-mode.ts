import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaIcon } from '../../core/icon/icon';
import { EvaCinemaModeAria, EvaCinemaModeAriaTransformed, transformEvaCinemaModeAria } from '../../utils/aria-utilities';

/**
 * Cinema mode toggle button for the Eva video player.
 *
 * Renders as a `role="button"` element with `tabindex="0"`. On click or
 * keyboard activation (`Enter` / `Space`), toggles cinema mode by:
 *
 * 1. Emitting `evaCinemaToggled` with the new state (`true`/`false`).
 * 2. Broadcasting the state on `EvaApi.cinemaModeSubject`, so any other
 *    control (e.g. a settings panel item) can toggle or react to it too.
 *
 * The component does not touch the DOM beyond its own host element.
 * All layout changes for cinema mode are the consumer's responsibility.
 *
 * The default `cinema-mode` icon is resolved from the Eva icon registry.
 * Register it with `addEvaIcons` before using the component. Use `evaCustomIcon`
 * to suppress the registry icon and project your own content instead.
 *
 * @example
 * // Register icon once (e.g. in main.ts or app config)
 * import { addEvaIcons } from 'ez-vid-ang';
 * import { evaCinemaModeIcon } from 'ez-vid-ang/icons';
 * addEvaIcons({ evaCinemaModeIcon });
 *
 * @example
 * <eva-cinema-mode (evaCinemaToggled)="isCinema.set($event)" />
 *
 * @example
 * // Custom icon
 * <eva-cinema-mode [evaCustomIcon]="true" (evaCinemaToggled)="isCinema.set($event)">
 *   <img src="theater-icon.svg" alt="" />
 * </eva-cinema-mode>
 */
@Component({
  selector: 'eva-cinema-mode',
  imports: [EvaIcon],
  templateUrl: './cinema-mode.html',
  styleUrl: './cinema-mode.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "evaAria().ariaLabel",
    "[attr.aria-valuetext]": "isActive() ? evaAria().ariaValueText.active : evaAria().ariaValueText.inactive",
    "[class.eva-cinema-mode-active]": "isActive()",
    "(click)": "toggle()",
    "(keydown)": "onKeyDown($event)"
  }
})
export class EvaCinemaMode implements OnInit, OnDestroy {
  private readonly evaAPI = inject(EvaApi);

  /** Subscription to cinemaModeSubject for external state changes (e.g. storage restore). */
  private cinemaSub: Subscription | null = null;

  /**
   * When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead,
   * allowing you to project a custom cinema-mode icon.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  /**
   * ARIA labels for the cinema mode button.
   *
   * @default { ariaLabel: "Cinema mode", ariaValueText: { active: "Cinema mode is on", inactive: "Cinema mode is off" } }
   */
  public readonly evaAria = input<EvaCinemaModeAriaTransformed, EvaCinemaModeAria>(transformEvaCinemaModeAria(undefined), { transform: transformEvaCinemaModeAria });

  /**
   * Emitted when cinema mode is toggled. `true` when entering, `false` when exiting.
   */
  public readonly evaCinemaToggled = output<boolean>();

  /** Whether cinema mode is currently active. */
  protected readonly isActive = signal(false);

  public ngOnInit(): void {
    this.cinemaSub = this.evaAPI.cinemaModeSubject.subscribe(active => {
      if (active !== this.isActive()) {
        this.isActive.set(active);
      }
    });
  }

  public ngOnDestroy(): void {
    this.cinemaSub?.unsubscribe();
  }

  protected toggle(): void {
    const next = !this.isActive();
    this.isActive.set(next);
    if (this.evaAPI.cinemaModeSubject.getValue() !== next) {
      this.evaAPI.cinemaModeSubject.next(next);
    }
    this.evaCinemaToggled.emit(next);
  }

  protected onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.toggle();
    }
  }
}
