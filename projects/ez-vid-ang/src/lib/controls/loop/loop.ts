import { ChangeDetectionStrategy, Component, computed, inject, input, signal, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { transformEvaLoopAria, EvaLoopAria, EvaLoopAriaTransformed } from '../../utils/aria-utilities';

/**
 * Loop toggle button for the Eva video player.
 *
 * Toggles the native `HTMLVideoElement.loop` property on click or keyboard
 * activation. Tracks loop state via a local signal and reflects it through
 * icon classes and ARIA attributes.
 *
 * Syncs with `EvaApi.loopSubject` — stays in sync when `evaVideoConfiguration.loop`
 * changes at runtime or when another component toggles loop.
 *
 * @example
 * <eva-loop />
 *
 * @example
 * <eva-loop [evaCustomIcon]="true">
 *   <my-loop-icon />
 * </eva-loop>
 */
@Component({
  selector: 'eva-loop',
  templateUrl: './loop.html',
  styleUrl: './loop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "ariaLabel()",
    "[attr.aria-valuetext]": "ariaValueText()",
    "[class.eva-loop-active]": "isLoopActive()",
    "(click)": "toggleLoop()",
    "(keydown)": "onKeydown($event)"
  }
})
export class EvaLoop implements OnInit, OnDestroy {
  private readonly evaApi = inject(EvaApi);
  private loop$: Subscription | null = null;

  /**
   * When `true`, suppresses the built-in SVG icon so a custom icon
   * can be projected via `<ng-content>`.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  /**
   * ARIA configuration for the loop button.
   * All properties are optional — defaults are applied via `transformEvaLoopAria`.
   */
  public readonly evaAria = input<EvaLoopAriaTransformed, EvaLoopAria>(
    transformEvaLoopAria(undefined),
    { transform: transformEvaLoopAria }
  );

  /** Whether video looping is currently enabled. */
  protected readonly isLoopActive = signal(false);

  protected readonly ariaLabel = computed(() => this.evaAria().ariaLabel);

  protected readonly ariaValueText = computed(() => this.isLoopActive()
    ? this.evaAria().ariaValueText.active
    : this.evaAria().ariaValueText.inactive);

  public ngOnInit(): void {
    this.loop$ = this.evaApi.loopSubject.subscribe((isLoop) => {
      this.isLoopActive.set(isLoop);
    });
  }

  public ngOnDestroy(): void {
    this.loop$?.unsubscribe();
  }

  protected toggleLoop(): void {
    if (!this.evaApi.validateVideoAndPlayerBeforeAction()) { return; }
    this.evaApi.assignedVideoElement!.loop = !this.evaApi.assignedVideoElement!.loop;
    this.evaApi.loopSubject.next(this.evaApi.assignedVideoElement!.loop);
  }

  protected onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.toggleLoop();
    }
  }
}
