import { ChangeDetectionStrategy, Component, ElementRef, inject, input, NgZone, OnDestroy, OnInit, output, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { transformEvaCinemaModeAria, EvaCinemaModeAria, EvaCinemaModeAriaTransformed } from '../../utils/aria-utilities';

/**
 * Cinema mode toggle button for the Eva video player.
 *
 * Renders as a `role="button"` element with `tabindex="0"`. On click or
 * keyboard activation (`Enter` / `Space`), toggles cinema mode by:
 *
 * 1. Adding/removing the `eva-cinema-mode` CSS class on the parent
 *    `<eva-player>` host element.
 * 2. Inserting/removing a full-viewport backdrop overlay (`<div>`) into
 *    `document.body` that dims the surrounding page content.
 * 3. Emitting `evaCinemaToggled` with the current state (`true`/`false`)
 *    so the consumer can react (hide sidebars, adjust layout).
 *
 * The component does **not** force any layout changes on the player.
 * The consumer's CSS decides what `eva-cinema-mode` looks like — the
 * component only provides the class and the backdrop.
 *
 * Supports custom icons via content projection when `evaCustomIcon` is `true`.
 *
 * @example
 * <eva-cinema-mode (evaCinemaToggled)="isCinema.set($event)" />
 *
 * @example
 * // Custom icon
 * <eva-cinema-mode [evaCustomIcon]="true" (evaCinemaToggled)="isCinema.set($event)">
 *   <img src="theater-icon.svg" alt="" />
 * </eva-cinema-mode>
 *
 * @example
 * // Consumer CSS for cinema mode layout
 * // eva-player.eva-cinema-mode {
 * //   width: 100vw;
 * //   position: relative;
 * //   z-index: 1000;
 * // }
 */
@Component({
  selector: 'eva-cinema-mode',
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
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly ngZone = inject(NgZone);

  /** Cached reference to the parent `<eva-player>` element. */
  private playerEl: HTMLElement | null = null;

  /** The backdrop overlay element injected into `document.body`. */
  private backdropEl: HTMLDivElement | null = null;

  /** Subscription to cinemaModeSubject for external state changes (e.g. storage restore). */
  private cinemaSub: Subscription | null = null;

  /**
   * When `true`, hides the built-in SVG icon so you can provide
   * your own icon via content projection.
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
    this.playerEl = this.el.nativeElement.closest('eva-player');
    if (!this.playerEl) {
      console.warn('EvaCinemaMode must be placed inside <eva-player>.');
    }

    this.cinemaSub = this.evaAPI.cinemaModeSubject.subscribe(active => {
      if (active !== this.isActive()) {
        if (active) {
          this.activate();
        } else {
          this.deactivate();
        }
      }
    });
  }

  public ngOnDestroy(): void {
    this.cinemaSub?.unsubscribe();
    if (this.isActive()) {
      this.deactivate();
    }
  }

  protected toggle(): void {
    if (this.isActive()) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  protected onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.toggle();
    }
  }

  private activate(): void {
    if (this.isActive()) { return; }
    this.isActive.set(true);
    this.playerEl?.classList.add('eva-cinema-mode');
    this.createBackdrop();
    this.evaAPI.cinemaModeSubject.next(true);
    this.evaCinemaToggled.emit(true);
  }

  private deactivate(): void {
    if (!this.isActive()) { return; }
    this.isActive.set(false);
    this.playerEl?.classList.remove('eva-cinema-mode');
    this.removeBackdrop();
    this.evaAPI.cinemaModeSubject.next(false);
    this.evaCinemaToggled.emit(false);
  }

  private createBackdrop(): void {
    if (this.backdropEl) { return; }
    this.backdropEl = document.createElement('div');
    this.backdropEl.className = 'eva-cinema-backdrop';
    this.backdropEl.addEventListener('click', this.onBackdropClick);
    document.body.appendChild(this.backdropEl);
  }

  private removeBackdrop(): void {
    if (!this.backdropEl) { return; }
    this.backdropEl.removeEventListener('click', this.onBackdropClick);
    if (this.backdropEl.parentNode) {
      document.body.removeChild(this.backdropEl);
    }
    this.backdropEl = null;
  }

  private readonly onBackdropClick = (): void => {
    this.ngZone.run(() => {
      this.toggle();
    });
  };
}
