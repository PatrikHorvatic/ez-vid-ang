import { Directive, effect, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { EvaApi } from '../../api/eva-api';

/**
 * Directive that attaches a `cuechange` event listener to a `<track>` element
 * and forwards cue changes to `EvaApi.onCueChange()`.
 *
 * Applied to `<track>` elements inside `EvaPlayer`'s template. When `evaCueChangeActive`
 * is `true`, the directive attaches a native `cuechange` listener to the track's
 * underlying `TextTrack`. When `evaCueChangeActive` switches to `false` (e.g. the user
 * disables subtitles), the listener is removed and the active subtitle cue in `EvaApi`
 * is cleared.
 *
 * The listener is managed reactively via Angular's `effect()` — any change to
 * `evaCueChangeActive` automatically attaches or detaches the handler without
 * requiring an explicit `ngOnChanges` implementation.
 *
 * @example
 * // Used inside EvaPlayer's template on each <track> element
 * <track
 *   evaCueChange
 *   [evaCueChangeActive]="isActiveSubtitleTrack"
 *   [src]="track.src"
 *   [kind]="track.kind"
 *   [label]="track.label"
 *   [srclang]="track.srclang"
 * />
 */
@Directive({
  selector: 'track[evaCueChange]'
})
export class EvaCueChangeDirective implements OnDestroy {

  /** Reference to the native `<track>` element this directive is applied to. */
  private el = inject<ElementRef<HTMLTrackElement>>(ElementRef);

  /**
   * The scoped `EvaApi` instance. Receives cue change notifications
   * via `onCueChange()`, which updates `currentSubtitleCue`.
   */
  private evaAPI = inject(EvaApi);

  /**
   * When `true`, a `cuechange` listener is attached to the underlying `TextTrack`,
   * forwarding active cue changes to `EvaApi.onCueChange()`.
   *
   * When switched to `false`, the listener is removed and the active subtitle cue is cleared.
   *
   * @default false
   */
  readonly evaCueChangeActive = input<boolean>(false);

  /**
   * Bound reference to the current `cuechange` handler.
   * Stored so it can be removed by the same reference in `detach()`.
   * `null` when no listener is currently attached.
   */
  private handler: (() => void) | null = null;

  /**
   * Sets up a reactive effect that attaches or detaches the `cuechange` listener
   * whenever `evaCueChangeActive` changes.
   *
   * - When `evaCueChangeActive` is `true` — creates a new bound handler and attaches
   *   it as a `cuechange` listener on the `TextTrack`. The handler calls
   *   `EvaApi.onCueChange(track)` to update the active subtitle cue.
   * - When `evaCueChangeActive` is `false` — calls `detach()` to remove the listener
   *   and null the handler reference.
   */
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

  /** Removes the `cuechange` listener when the directive is destroyed. */
  ngOnDestroy(): void {
    this.detach();
  }

  /**
   * Removes the active `cuechange` listener from the `TextTrack` and clears
   * the handler reference. Safe to call even if no listener is currently attached.
   */
  private detach(): void {
    if (this.handler) {
      this.el.nativeElement.track.removeEventListener('cuechange', this.handler);
      this.handler = null;
    }
  }
}