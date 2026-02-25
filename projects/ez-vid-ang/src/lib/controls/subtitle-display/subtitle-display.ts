import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, WritableSignal } from "@angular/core";
import { EvaApi } from "../../api/eva-api";
import { Subscription } from "rxjs";

/**
 * Subtitle display component for the Eva video player.
 *
 * Renders the currently active subtitle cue sourced directly from
 * `EvaApi.currentSubtitleCue`. The component is visible only when a cue is active
 * AND the player is not in Picture-in-Picture mode. It automatically adjusts its
 * bottom position based on whether the controls container is visible, ensuring
 * subtitles never overlap the controls bar.
 *
 * Visibility and positioning are driven entirely by host class and style bindings:
 * - `eva-subtitle-display--visible` — applied when `currentSubtitleCue` is non-null
 *   AND `pipWindowActive` is `false`. When PiP is active, this class is suppressed
 *   because `EvaApi.setupPipListeners()` switches the active `TextTrack` to
 *   `mode="showing"`, handing subtitle rendering off to the browser's native PiP UI.
 * - `padding-bottom` — switches between a minimal offset (`8px`) when controls are
 *   hidden and a calculated offset (`--eva-control-element-height + --eva-scrub-bar-heights + 12px`)
 *   when controls are visible.
 *
 * The `cue` signal is read directly from `EvaApi.currentSubtitleCue`, which is
 * updated by `EvaCueChangeDirective` on each native `cuechange` event. No additional
 * subscription is required for the cue text itself.
 *
 * @example
 * // Place inside eva-player to render active subtitle cues
 * <eva-player id="my-player" [evaVideoSources]="sources">
 *   <eva-subtitle-display />
 * </eva-player>
 */
@Component({
  selector: "eva-subtitle-display",
  templateUrl: "./subtitle-display.html",
  styleUrl: "./subtitle-display.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Suppressed during PiP — the browser renders subtitles natively inside the PiP window
    "[class.eva-subtitle-display--visible]": "cue() !== null && !pipWindowActive()",
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

  /**
   * Whether the player is currently in Picture-in-Picture mode.
   * When `true`, the `eva-subtitle-display--visible` class is suppressed so the
   * Angular subtitle overlay is hidden. The browser takes over subtitle rendering
   * inside the PiP window via the active `TextTrack` (mode switched to `"showing"`
   * by `EvaApi.setupPipListeners()`).
   * Updated by subscribing to `EvaApi.pictureInPictureSubject`.
   */
  protected pipWindowActive: WritableSignal<boolean> = signal(false);

  /** Subscription to controls container visibility changes. Cleaned up in `ngOnDestroy`. */
  private controlsVisibility$: Subscription | null = null;

  /** Subscription to Picture-in-Picture state changes. Cleaned up in `ngOnDestroy`. */
  private pipWindowActive$: Subscription | null = null;

  /**
   * Subscribes to:
   * - `EvaApi.componentsContainerVisibilityStateSubject` — to adjust `padding-bottom`
   *   based on controls bar visibility.
   * - `EvaApi.pictureInPictureSubject` — to suppress the subtitle overlay when PiP is active.
   */
  ngOnInit(): void {
    this.controlsVisibility$ = this.evaAPI.componentsContainerVisibilityStateSubject.subscribe((a) => {
      this.controlsCointainerNotVisible.set(a);
    });
    this.pipWindowActive$ = this.evaAPI.pictureInPictureSubject.subscribe((a) => {
      this.pipWindowActive.set(a);
    });
  }

  /** Unsubscribes from all active subscriptions to prevent memory leaks. */
  ngOnDestroy(): void {
    this.controlsVisibility$?.unsubscribe();
    this.pipWindowActive$?.unsubscribe();
  }
}