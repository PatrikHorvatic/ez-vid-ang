import { Component, inject, input, Input, OnChanges, OnDestroy, OnInit, signal, SimpleChanges, WritableSignal } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { Subscription } from 'rxjs';
import { transformTimeoutDuration } from '../../utils/utilities';

/**
 * Controls container component for the Eva video player.
 *
 * Wraps the player control bar and manages its visibility. When `evaAutohide` is enabled,
 * the container hides itself after `evaAutohideTime` ms of inactivity by applying the
 * `hide` class to the host. It resets the timer on every user interaction event from `EvaApi`.
 *
 * Auto-hide lifecycle:
 * - Enabled on `ngOnInit` if `evaAutohide` is `true`.
 * - Can be toggled at runtime via `ngOnChanges` — switching `evaAutohide` from `false` to `true`
 *   starts listening and schedules the first hide; switching to `false` cancels any pending
 *   timeout, unsubscribes, and immediately shows the controls.
 *
 * @example
 * // Always visible
 * <eva-controls-container />
 *
 * @example
 * // Auto-hide after 4 seconds of inactivity
 * <eva-controls-container [evaAutohide]="true" [evaAutohideTime]="4000" />
 */
@Component({
  selector: 'eva-controls-container',
  templateUrl: './controls-container.component.html',
  styleUrl: './controls-container.component.scss',
  standalone: false,
  host: {
    "[class.hide]": "hideControls()"
  }
})
export class EvaControlsContainerComponent implements OnInit, OnDestroy, OnChanges {

  private evaAPI = inject(EvaApi);

  /**
   * Enables the auto-hide behaviour. When `true`, the controls container hides
   * after `evaAutohideTime` ms of inactivity and reappears on user interaction.
   *
   * Can be toggled at runtime — changes are handled in `ngOnChanges`.
   *
   * @default false
   */
  readonly evaAutohide = input<boolean>(false);

  /**
   * Duration in milliseconds before the controls container hides after the last
   * user interaction. Only applies when `evaAutohide` is `true`.
   * Transformed via `transformTimeoutDuration`.
   *
   * @default 3000
   * @todo Add explicit `NodeJS.Timeout` type for `hideTimeout`.
   */
  readonly evaAutohideTime = input<number, number>(3000, { transform: transformTimeoutDuration });

  /** Whether the controls container is currently hidden. Applies the `hide` class to the host. */
  protected hideControls: WritableSignal<boolean> = signal(false);

  /** Subscription to user interaction events from `EvaApi`. Cleaned up in `ngOnDestroy` or when auto-hide is disabled. */
  private userInteraction$: Subscription | null = null;

  /**
   * Reference to the active auto-hide timeout.
   * Cleared whenever a new user interaction is detected or auto-hide is disabled.
   *
   * @todo Replace `any` with the explicit `NodeJS.Timeout` type.
   */
  //TODO - Add a timeout type!
  /**This is NodeJS.Timeout type! */
  private hideTimeout: any;

  /**
   * Starts listening for user interaction events if `evaAutohide` is enabled on init,
   * which will schedule the first hide after `evaAutohideTime` ms.
   */
  ngOnInit(): void {
    if (this.evaAutohide()) {
      this.startListening();
    }
  }

  /**
   * Responds to runtime changes of `evaAutohide`.
   *
   * - `evaAutohide` changed to `true` — starts listening and schedules the first hide.
   * - `evaAutohide` changed to `false` — cancels any pending timeout, unsubscribes,
   *   and immediately makes the controls visible.
   *
   * First-change is ignored since `ngOnInit` handles the initial state.
   *
   * @todo `evaAutohideTime` change handling is not yet implemented.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes["evaAutohide"]) {
      if (!changes["evaAutohide"].firstChange) {
        if (changes["evaAutohide"].currentValue === true) {
          this.startListening();
          this.prepareHiding();
        }
        else {
          this.disableHiding();
        }
      }
    }

    // TODO - Needs testing */
    if (changes["evaAutohideTime"]) {
      if (!changes["evaAutohideTime"].firstChange) {

      }
    }
  }

  /** Unsubscribes from the user interaction subscription to prevent memory leaks. */
  ngOnDestroy(): void {
    if (this.userInteraction$) {
      this.userInteraction$.unsubscribe();
    }
  }

  /**
   * Subscribes to `EvaApi.triggerUserInteraction` and resets the hide timer
   * on every interaction event, keeping the controls visible during activity.
   */
  private startListening() {
    this.userInteraction$ = this.evaAPI.triggerUserInteraction.subscribe(e => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      this.prepareHiding();
    });
  }

  /**
   * Disables auto-hide by cancelling any pending timeout, unsubscribing from
   * user interaction events, and immediately showing the controls.
   */
  private disableHiding() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    if (this.userInteraction$) {
      this.userInteraction$.unsubscribe();
    }
    this.hideControls.set(false);
  }

  /**
   * Shows the controls immediately and schedules them to hide after `evaAutohideTime` ms.
   * Any previously scheduled hide is cancelled before scheduling a new one.
   */
  private prepareHiding() {
    this.hideControls.set(false);
    this.hideTimeout = setTimeout(() => {
      this.hideControls.set(true);
    }, this.evaAutohideTime());
  }
}