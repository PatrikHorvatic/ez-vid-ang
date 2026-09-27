import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, OnDestroy, OnInit, signal, viewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { EvaApi } from "../../api/eva-api";
import { EvaIcon } from "../../core/icon/icon";
import { DEFAULT_SEEK_SECONDS, DOUBLE_TAP_RIPPLE_DURATION_MS, DOUBLE_TAP_THRESHOLD_MS, SEEK_ICON_THRESHOLD_30 } from "../../constants";
import { validateAndTransformEvaForwardAndBackwardSeconds } from "../../utils/aria-utilities";
import { transformTimeoutDuration } from "../../utils/utilities";

/** Which half of the video a tap landed in. */
type EvaTapSide = "left" | "right";

/** A single transient ripple flash, removed once its animation duration elapses. */
type EvaTapRipple = {
  id: number;
  side: EvaTapSide;
};

let rippleIdCounter = 0;

/**
 * Double-tap-to-seek gesture zones for the Eva video player.
 *
 * Renders two invisible full-height zones over the left and right halves of the video.
 * Tapping twice in quick succession on either zone seeks backward (left) or forward
 * (right) by `evaDoubleTapSeekSeconds`, showing a brief ripple flash and a "-10s"/"+10s"
 * label. Tapping again within the same window (a "triple tap", etc.) accumulates —
 * `-10s`, then `-20s`, and so on — matching the standard mobile UX popularized by
 * YouTube and Netflix.
 *
 * **Touch-only by design**: the zones only intercept pointer input on touch-primary
 * devices (`@media (hover: none) and (pointer: coarse)`) — on mouse/trackpad devices
 * they never capture clicks, so `eva-overlay-play`'s own click-to-toggle-play behavior
 * is completely unaffected on desktop.
 *
 * **A single tap toggles play/pause.** Because a tap must be intercepted (and
 * `preventDefault()`-ed, to reliably tell it apart from a second tap arriving shortly
 * after, and to suppress iOS Safari's native double-tap-to-zoom) before it's known
 * whether a second tap will follow, the zones cannot simply let a lone tap's synthetic
 * `click` fall through to whatever is underneath (typically `eva-overlay-play`). Instead,
 * a confirmed single tap calls `EvaApi.playOrPauseVideo()` directly — the same action
 * `eva-overlay-play`'s click already performs — so combining both components keeps
 * exactly the same single-tap behavior on touch, with double-tap-seek layered on top.
 *
 * **Works identically with `EvaHlsDirective`/`EvaDashDirective`**: seeking is delegated
 * to `EvaApi.seekBack()`/`seekForward()`, the same methods `eva-backward`/`eva-forward`
 * and keyboard shortcuts use — these operate on the native `HTMLVideoElement.currentTime`
 * directly, which hls.js/dash.js also drive under the hood, so no streaming-specific
 * handling is needed.
 *
 * Marked `aria-hidden` and not focusable — equivalent functionality (seek buttons, the
 * play/pause button, keyboard shortcuts) remains fully available to assistive technology
 * through those existing, purpose-built components; this is a supplementary touch
 * convenience layer, not a replacement for them.
 *
 * @example
 * // Minimal usage — inside <eva-player>, alongside eva-overlay-play
 * <eva-overlay-play />
 * <eva-double-tap-seek />
 *
 * @example
 * // Custom seek amount, labels, and ripple duration
 * <eva-double-tap-seek
 *   [evaDoubleTapSeekSeconds]="30"
 *   [evaSeekBackwardLabel]="(s) => '⏪ ' + s + 's'"
 *   [evaSeekForwardLabel]="(s) => s + 's ⏩'"
 *   [evaRippleDurationMs]="1000"
 * />
 *
 * @example
 * // Custom icons via content projection — evaSeekBackward for the left/backward
 * // ripple, evaSeekForward for the right/forward ripple
 * <eva-double-tap-seek [evaCustomIcon]="true">
 *   <img evaSeekBackward src="path-to-your-rewind-icon" />
 *   <img evaSeekForward src="path-to-your-fast-forward-icon" />
 * </eva-double-tap-seek>
 *
 * @example
 * // Disabling the ripple flash (e.g. bound to a user setting, toggleable at runtime) —
 * // the "-10s"/"+10s" label and the seek itself are unaffected
 * <eva-double-tap-seek [evaRippleEnabled]="rippleEnabled()" />
 */
@Component({
  selector: "eva-double-tap-seek",
  imports: [EvaIcon],
  templateUrl: "./double-tap-seek.html",
  styleUrl: "./double-tap-seek.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "aria-hidden": "true",
    "[style.height]": "controlsContainerHidden() ? '100%' : 'calc(100% - var(--eva-control-element-height))'",
    "[style.--eva-double-tap-ripple-duration]": "rippleDurationStyle()",
  },
})
export class EvaDoubleTapSeek implements OnInit, OnDestroy {
  private readonly evaAPI = inject(EvaApi);

  /**
   * Number of seconds to seek per tap (and per additional accumulated tap).
   * Validated via `validateAndTransformEvaForwardAndBackwardSeconds`, the same validator
   * `eva-backward`/`eva-forward` use. Also selects the ripple icon: `30` → `backward-30`/
   * `forward-30`, anything else (including the `10` default) → `backward-10`/`forward-10`.
   *
   * @default 10
   */
  public readonly evaDoubleTapSeekSeconds = input<number, number>(DEFAULT_SEEK_SECONDS, { transform: validateAndTransformEvaForwardAndBackwardSeconds });

  /**
   * Formats the backward-seek ripple label from the accumulated seconds.
   *
   * @default (seconds) => `-${seconds}s`
   */
  public readonly evaSeekBackwardLabel = input<(seconds: number) => string>((seconds) => `-${seconds}s`);

  /**
   * Formats the forward-seek ripple label from the accumulated seconds.
   *
   * @default (seconds) => `+${seconds}s`
   */
  public readonly evaSeekForwardLabel = input<(seconds: number) => string>((seconds) => `+${seconds}s`);

  /**
   * How long a tap ripple flash stays on screen, in milliseconds. Drives both the removal
   * timer and the CSS animation duration (via the `--eva-double-tap-ripple-duration` custom
   * property, set on the host so it overrides the value from `eva-required-import.scss` for
   * this instance only). Negative values are clamped to `0` via `transformTimeoutDuration`.
   *
   * @default 600
   */
  public readonly evaRippleDurationMs = input<number, number>(DOUBLE_TAP_RIPPLE_DURATION_MS, { transform: transformTimeoutDuration });

  /** `evaRippleDurationMs` formatted as a CSS duration (e.g. `"600ms"`) for the host style binding. */
  protected readonly rippleDurationStyle = computed<string>(() => `${this.evaRippleDurationMs()}ms`);

  /**
   * Whether a double-tap seek shows the ripple flash. The `-10s`/`+10s` label is unaffected —
   * this only toggles the background flash — and seeking itself always works regardless of
   * this input. Backed by a signal input, so it can be flipped at runtime.
   *
   * @default true
   */
  public readonly evaRippleEnabled = input<boolean>(true);

  /**
   * When `true`, suppresses the registry-sourced icons and renders `<ng-content>` instead,
   * allowing you to project custom backward/forward ripple icons using the `evaSeekBackward`
   * and `evaSeekForward` content selectors.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  private readonly leftZone = viewChild.required<ElementRef<HTMLElement>>("leftZone");
  private readonly rightZone = viewChild.required<ElementRef<HTMLElement>>("rightZone");

  /**
   * Whether the controls container is currently hidden — mirrors `EvaOverlayPlay`'s own
   * sizing behavior so the zones cover the full player once the controls bar auto-hides,
   * and leave room for it while visible.
   */
  protected readonly controlsContainerHidden = signal(false);

  /** The side currently accumulating taps, or `null` when no seek ripple is active. */
  protected readonly activeSide = signal<EvaTapSide | null>(null);

  /** Total seconds accumulated for the active side's ripple label (e.g. `20` after two double-taps). */
  protected readonly accumulatedSeconds = signal(0);

  /** Transient ripple flashes currently rendered, each removed after `evaRippleDurationMs`. */
  protected readonly ripples = signal<EvaTapRipple[]>([]);

  private controlsVisibility$: Subscription | null = null;

  /** Bound reference to `handleTouchEnd` for the left zone, stored for listener removal. */
  private readonly onLeftTouchEnd = (event: TouchEvent): void => {
    this.handleTouchEnd("left", event);
  };

  /** Bound reference to `handleTouchEnd` for the right zone, stored for listener removal. */
  private readonly onRightTouchEnd = (event: TouchEvent): void => {
    this.handleTouchEnd("right", event);
  };

  /** Side of the most recent tap, used to detect a same-side repeat within `DOUBLE_TAP_THRESHOLD_MS`. */
  private lastTapSide: EvaTapSide | null = null;

  /** Timestamp (`Date.now()`) of the most recent tap. */
  private lastTapTime = 0;

  /** Pending single-tap action, fired if no repeat tap arrives in time. Cleared on a confirmed repeat. */
  private pendingSingleTapTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Resets the active seek sequence once no further tap arrives within the threshold. */
  private resetTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Pending removal timers for `ripples`, keyed by ripple `id`. Cleared in `ngOnDestroy`. */
  private readonly rippleTimeouts = new Map<number, ReturnType<typeof setTimeout>>();

  /**
   * Subscribes to `EvaApi.componentsContainerVisibilityStateSubject` for sizing, and attaches
   * non-passive `touchend` listeners on both zones — attached manually (rather than via a
   * template `(touchend)` binding) so `preventDefault()` is guaranteed to work regardless of
   * whether the consuming app's own Zone.js configuration marks touch events passive globally.
   */
  public ngOnInit(): void {
    this.controlsVisibility$ = this.evaAPI.componentsContainerVisibilityStateSubject.subscribe((hidden) => {
      this.controlsContainerHidden.set(hidden);
    });

    this.leftZone().nativeElement.addEventListener("touchend", this.onLeftTouchEnd, { passive: false });
    this.rightZone().nativeElement.addEventListener("touchend", this.onRightTouchEnd, { passive: false });
  }

  public ngOnDestroy(): void {
    this.controlsVisibility$?.unsubscribe();
    this.leftZone().nativeElement.removeEventListener("touchend", this.onLeftTouchEnd);
    this.rightZone().nativeElement.removeEventListener("touchend", this.onRightTouchEnd);
    this.clearPendingSingleTap();
    this.clearResetTimeout();
    this.rippleTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.rippleTimeouts.clear();
  }

  /**
   * Handles a tap on the given zone.
   *
   * `preventDefault()` unconditionally suppresses the browser's synthetic `click` (and,
   * on iOS Safari, double-tap-to-zoom) that would otherwise follow — see the class-level
   * doc comment for why this means a confirmed single tap must toggle play/pause itself.
   *
   * A tap on the same side within `DOUBLE_TAP_THRESHOLD_MS` of the previous one is treated
   * as a repeat (confirming or extending a seek sequence); otherwise it starts a pending
   * single-tap timer that fires `EvaApi.playOrPauseVideo()` if nothing follows in time.
   */
  private handleTouchEnd(side: EvaTapSide, event: TouchEvent): void {
    event.preventDefault();
    this.evaAPI.triggerUserInteraction.next(event);

    const now = Date.now();
    const isRepeatTap = this.lastTapSide === side && now - this.lastTapTime <= DOUBLE_TAP_THRESHOLD_MS;
    this.lastTapSide = side;
    this.lastTapTime = now;

    if (isRepeatTap) {
      this.clearPendingSingleTap();
      this.registerSeekTap(side);
      return;
    }

    this.clearPendingSingleTap();
    this.pendingSingleTapTimeout = setTimeout(() => {
      this.pendingSingleTapTimeout = null;
      this.lastTapSide = null;
      this.evaAPI.playOrPauseVideo();
    }, DOUBLE_TAP_THRESHOLD_MS);
  }

  /** Seeks, accumulates the ripple label, and (re)schedules the sequence reset. */
  private registerSeekTap(side: EvaTapSide): void {
    const seconds = this.evaDoubleTapSeekSeconds();

    if (this.activeSide() === side) {
      this.accumulatedSeconds.update((total) => total + seconds);
    } else {
      this.activeSide.set(side);
      this.accumulatedSeconds.set(seconds);
    }

    if (side === "left") {
      this.evaAPI.seekBack(seconds);
    } else {
      this.evaAPI.seekForward(seconds);
    }

    if (this.evaRippleEnabled()) {
      this.spawnRipple(side);
    }
    this.scheduleReset();
  }

  /** Adds a new ripple flash, self-removing after `evaRippleDurationMs`. */
  private spawnRipple(side: EvaTapSide): void {
    rippleIdCounter += 1;
    const id = rippleIdCounter;
    this.ripples.update((current) => [...current, { id, side }]);
    const timeout = setTimeout(() => {
      this.rippleTimeouts.delete(id);
      this.ripples.update((current) => current.filter((ripple) => ripple.id !== id));
    }, this.evaRippleDurationMs());
    this.rippleTimeouts.set(id, timeout);
  }

  /** (Re)schedules clearing `activeSide`/`accumulatedSeconds` once taps stop arriving. */
  private scheduleReset(): void {
    this.clearResetTimeout();
    this.resetTimeout = setTimeout(() => {
      this.resetTimeout = null;
      this.activeSide.set(null);
      this.accumulatedSeconds.set(0);
      this.lastTapSide = null;
    }, DOUBLE_TAP_THRESHOLD_MS);
  }

  private clearPendingSingleTap(): void {
    if (this.pendingSingleTapTimeout) {
      clearTimeout(this.pendingSingleTapTimeout);
      this.pendingSingleTapTimeout = null;
    }
  }

  private clearResetTimeout(): void {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }
  }

  /** Resolves the ripple label text for the given side from the accumulated seconds. */
  protected labelFor(side: EvaTapSide): string {
    return side === "left" ? this.evaSeekBackwardLabel()(this.accumulatedSeconds()) : this.evaSeekForwardLabel()(this.accumulatedSeconds());
  }

  /** Resolves the registry icon name for the given side, matching `eva-backward`/`eva-forward`'s own convention. */
  protected iconFor(side: EvaTapSide): string {
    const variant = this.evaDoubleTapSeekSeconds() === SEEK_ICON_THRESHOLD_30 ? SEEK_ICON_THRESHOLD_30 : DEFAULT_SEEK_SECONDS;
    return `${side === "left" ? "backward" : "forward"}-${variant}`;
  }
}
