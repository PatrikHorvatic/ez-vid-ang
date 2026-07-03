import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaIcon } from '../../core/icon/icon';
import { EvaLoopAria, EvaLoopAriaTransformed, transformEvaLoopAria } from '../../utils/aria-utilities';

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
 * The default `loop` icon is resolved from the Eva icon registry.
 * Register it with `addEvaIcons` before using the component. Use `evaCustomIcon`
 * to suppress the registry icon and project your own content instead.
 *
 * @example
 * // Register icon once (e.g. in main.ts or app config)
 * import { addEvaIcons } from 'ez-vid-ang';
 * import { evaLoopIcon } from 'ez-vid-ang/icons';
 * addEvaIcons({ evaLoopIcon });
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
  imports: [EvaIcon],
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
   * When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead,
   * allowing you to project a custom loop icon.
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
