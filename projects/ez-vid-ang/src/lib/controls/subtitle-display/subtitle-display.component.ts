import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, WritableSignal } from "@angular/core";
import { EvaApi } from "../../api/eva-api";
import { Subscription } from "rxjs";

/**
 * Subtitle display component for the Eva video player.
 *
 * Renders the currently active subtitle cue sourced directly from
 * `EvaApi.currentSubtitleCue`. The component is visible only when a cue is active
 * and automatically adjusts its bottom position based on whether the controls
 * container is visible, ensuring subtitles never overlap the controls bar.
 *
 * Visibility and positioning are driven entirely by host class and style bindings:
 * - `eva-subtitle-display--visible` — applied when `currentSubtitleCue` is non-null.
 * - `padding-bottom` — switches between a minimal offset (`8px`) when controls are
 *   hidden and a calculated offset accounting for `--eva-control-element-height`,
 *   `--eva-scrub-bar-heights`, and a `12px` gap when controls are visible.
 *
 * The `cue` signal is read directly from `EvaApi.currentSubtitleCue`, which is
 * updated by `EvaCueChangeDirective` on each native `cuechange` event. No additional
 * subscription or polling is required.
 *
 * @example
 * // Place inside eva-player to render active subtitle cues
 * <eva-player id="my-player" [evaVideoSources]="sources">
 *   <eva-subtitle-display />
 * </eva-player>
 */
@Component({
  selector: "eva-subtitle-display",
  templateUrl: "./subtitle-display.component.html",
  styleUrl: "./subtitle-display.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class.eva-subtitle-display]": "true",
    "[class.eva-subtitle-display--visible]": "cue() !== null",
    "[style.padding-bottom]": "controlsCointainerNotVisible() ? '8px' : 'calc(var(--eva-control-element-height) + var(--eva-scrub-bar-heights) + 12px)'"
  }
})
export class EvaSubtitleDisplay implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);

  /**
   * The currently active subtitle cue text, or `null` when no cue is active.
   * Read directly from `EvaApi.currentSubtitleCue` — updated by `EvaCueChangeDirective`
   * on each `cuechange` event fired by the active `TextTrack`.
   */
  protected readonly cue = this.evaAPI.currentSubtitleCue;

  /**
   * Whether the controls container is currently not visible.
   * When `true`, the subtitle shifts to a minimal `8px` bottom offset.
   * When `false`, it shifts up to clear the controls bar using CSS custom properties.
   * Updated by subscribing to `EvaApi.componentsContainerVisibilityStateSubject`.
   */
  protected controlsCointainerNotVisible: WritableSignal<boolean> = signal(false);

  /** Subscription to controls container visibility changes. Cleaned up in `ngOnDestroy`. */
  private controlsVisibiliti$: Subscription | null = null;

  /**
   * Subscribes to `EvaApi.componentsContainerVisibilityStateSubject` to track
   * whether the controls container is currently visible, so the subtitle
   * position can adjust accordingly.
   */
  ngOnInit(): void {
    this.controlsVisibiliti$ = this.evaAPI.componentsContainerVisibilityStateSubject.subscribe((a) => {
      this.controlsCointainerNotVisible.set(a);
    });
  }

  /** Unsubscribes from the controls visibility subscription to prevent memory leaks. */
  ngOnDestroy(): void {
    this.controlsVisibiliti$?.unsubscribe();
  }
}