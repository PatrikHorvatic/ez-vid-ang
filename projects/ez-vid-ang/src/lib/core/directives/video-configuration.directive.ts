import { AfterViewInit, Directive, ElementRef, inject, input, OnChanges, SimpleChanges } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaVideoElementConfiguration } from '../../types';
import { validateAndPrepareStartingVideoVolume } from '../../utils/utilities';

/**
 * Directive that applies an `EvaVideoElementConfiguration` object to a native
 * `<video>` element's DOM properties after the view is initialized.
 *
 * Applied as an attribute on a `<video>` element:
 * ```html
 * <video evaVideoConfiguration [evaVideoConfig]="config" />
 * ```
 *
 * Configuration is applied in `ngAfterViewInit` to ensure the native element is
 * available. Runtime changes to `evaVideoConfig` are applied via `ngOnChanges`,
 * but only after the view has been initialized to avoid operating on an
 * unrendered element.
 *
 * Only properties that are explicitly set (truthy) in the config object are applied —
 * unset properties are left at their native defaults. The one exception is
 * `startingVolume`, which is validated and clamped via `validateAndPrepareStartingVideoVolume`
 * before being assigned.
 *
 * Supported configuration properties (all optional):
 * - `width` / `height` — dimensions of the video element
 * - `autoplay` — start playback automatically
 * - `controls` — show native browser controls
 * - `crossorigin` — CORS setting (`"anonymous"` or `"use-credentials"`)
 * - `disablePictureInPicture` — prevent picture-in-picture mode
 * - `disableRemotePlayback` — prevent remote playback (e.g. Chromecast)
 * - `loop` — loop playback
 * - `muted` — start muted
 * - `playinline` — play inline on mobile (maps to `playsInline`)
 * - `poster` — URL of the poster image shown before playback
 * - `preload` — preload hint (`"none"`, `"metadata"`, or `"auto"`)
 * - `startingVolume` — initial volume, validated and clamped to `[0, 1]`
 *
 * @example
 * <video
 *   evaVideoConfiguration
 *   [evaVideoConfig]="{ autoplay: true, muted: true, startingVolume: 0.8, poster: '/thumb.jpg' }"
 * />
 */
@Directive({
  selector: 'video[evaVideoConfiguration]',
  standalone: false
})
export class EvaVideoConfigurationDirective implements OnChanges, AfterViewInit {
  private evaAPI = inject(EvaApi);
  private elementRef = inject(ElementRef<HTMLVideoElement>);

  /**
   * The configuration object to apply to the native `<video>` element.
   *
   * **Required.** See `EvaVideoElementConfiguration` for all available properties.
   * Only truthy properties are applied — unset properties are left at their native defaults.
   */
  readonly evaVideoConfig = input.required<EvaVideoElementConfiguration>();

  /**
   * Guards against applying configuration before the native element is available.
   * Set to `true` in `ngAfterViewInit`.
   */
  private isViewInitialized = false;

  /**
   * Responds to runtime changes of `evaVideoConfig`.
   * Configuration is only re-applied if the view has already been initialized
   * and the `videoConfig` binding has changed.
   *
   * @param changes - The `SimpleChanges` map provided by Angular.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Only apply changes if view is initialized and videoConfig changed
    if (this.isViewInitialized && changes['videoConfig']) {
      this.applyConfiguration();
    }
  }

  /**
   * Marks the view as initialized and applies the initial configuration
   * to the native `<video>` element.
   */
  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    this.applyConfiguration();
  }

  /**
   * Iterates over all supported `EvaVideoElementConfiguration` properties and
   * applies each one directly to the native `<video>` element if the value is truthy.
   *
   * `startingVolume` is passed through `validateAndPrepareStartingVideoVolume`
   * before assignment to ensure it is clamped to a valid `[0, 1]` range.
   *
   * No-ops if `evaVideoConfig()` returns a falsy value.
   */
  private applyConfiguration(): void {
    if (!this.evaVideoConfig()) {
      return;
    }
    if (this.evaVideoConfig().width) {
      this.elementRef.nativeElement.width = this.evaVideoConfig().width!;
    }
    if (this.evaVideoConfig().height) {
      this.elementRef.nativeElement.height = this.evaVideoConfig().height!;
    }
    if (this.evaVideoConfig().autoplay) {
      this.elementRef.nativeElement.autoplay = this.evaVideoConfig().autoplay!;
    }
    if (this.evaVideoConfig().controls) {
      this.elementRef.nativeElement.controls = this.evaVideoConfig().controls!;
    }
    if (this.evaVideoConfig().crossorigin) {
      this.elementRef.nativeElement.crossOrigin = this.evaVideoConfig().crossorigin!;
    }
    if (this.evaVideoConfig().disablePictureInPicture) {
      this.elementRef.nativeElement.disablePictureInPicture = this.evaVideoConfig().disablePictureInPicture!;
    }
    if (this.evaVideoConfig().disableRemotePlayback) {
      this.elementRef.nativeElement.disableRemotePlayback = this.evaVideoConfig().disableRemotePlayback!;
    }
    if (this.evaVideoConfig().loop) {
      this.elementRef.nativeElement.loop = this.evaVideoConfig().loop!;
    }
    if (this.evaVideoConfig().muted) {
      this.elementRef.nativeElement.muted = this.evaVideoConfig().muted!;
    }
    if (this.evaVideoConfig().playinline) {
      this.elementRef.nativeElement.playsInline = this.evaVideoConfig().playinline!;
    }
    if (this.evaVideoConfig().poster) {
      this.elementRef.nativeElement.poster = this.evaVideoConfig().poster!;
    }
    if (this.evaVideoConfig().preload) {
      this.elementRef.nativeElement.preload = this.evaVideoConfig().preload!;
    }
    if (this.evaVideoConfig().startingVolume) {
      this.elementRef.nativeElement.volume = validateAndPrepareStartingVideoVolume(this.evaVideoConfig().startingVolume);
    }
  }
}