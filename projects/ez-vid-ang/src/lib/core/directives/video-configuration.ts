import { AfterViewInit, Directive, ElementRef, inject, input, OnChanges, SecurityContext, SimpleChanges } from '@angular/core';
import { EvaApi } from '../../api/eva-api';
import { EvaVideoElementConfiguration } from '../../types';
import { validateAndPrepareStartingVideoVolume } from '../../utils/utilities';
import { DomSanitizer } from '@angular/platform-browser';

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
 * Sanitization strategy per property type:
 * - `poster` — sanitized with `SecurityContext.URL` as it is rendered as a resource URL.
 * - `width` / `height` / `startingVolume` — assigned as typed numbers; no sanitization needed.
 * - `autoplay` / `controls` / `loop` / `muted` / `playinline` /
 *   `disablePictureInPicture` / `disableRemotePlayback` — assigned as typed booleans; no sanitization needed.
 * - `crossorigin` / `preload` — constrained enum strings assigned directly to typed DOM properties; no sanitization needed.
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
  standalone: true
})
export class EvaVideoConfigurationDirective implements OnChanges, AfterViewInit {
  protected evaAPI = inject(EvaApi);
  private elementRef = inject(ElementRef<HTMLVideoElement>);
  private sanitizer = inject(DomSanitizer);

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
   * Sanitization is applied only where values are rendered as resource URLs:
   * - `poster` is sanitized with `SecurityContext.URL`.
   * - All other properties are typed DOM assignments (boolean, number, or constrained
   *   enum string) and do not require sanitization.
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
    const config = this.evaVideoConfig();

    // Numeric properties — assigned as typed numbers, no sanitization needed
    if (config.width) {
      this.elementRef.nativeElement.width = config.width;
    }
    if (config.height) {
      this.elementRef.nativeElement.height = config.height;
    }

    // Boolean properties — assigned as typed booleans, no sanitization needed
    if (config.autoplay) {
      this.elementRef.nativeElement.autoplay = config.autoplay;
    }
    if (config.controls) {
      this.elementRef.nativeElement.controls = config.controls;
    }
    if (config.disablePictureInPicture) {
      this.elementRef.nativeElement.disablePictureInPicture = config.disablePictureInPicture;
    }
    if (config.disableRemotePlayback) {
      this.elementRef.nativeElement.disableRemotePlayback = config.disableRemotePlayback;
    }
    if (config.loop) {
      this.elementRef.nativeElement.loop = config.loop;
    }
    if (config.muted) {
      this.elementRef.nativeElement.muted = config.muted;
    }
    if (config.playinline) {
      this.elementRef.nativeElement.playsInline = config.playinline;
    }

    // Constrained enum strings — typed DOM properties with a fixed set of valid values,
    // no sanitization needed
    if (config.crossorigin) {
      this.elementRef.nativeElement.crossOrigin = config.crossorigin;
    }
    if (config.preload) {
      this.elementRef.nativeElement.preload = config.preload;
    }

    // URL property — sanitized with SecurityContext.URL as the browser fetches this
    // as a resource and it is reflected in the DOM as an attribute
    if (config.poster) {
      this.elementRef.nativeElement.poster = this.sanitizer.sanitize(SecurityContext.URL, config.poster) ?? '';
    }

    // Volume — validated and clamped to [0, 1] by validateAndPrepareStartingVideoVolume,
    // assigned as a typed number, no sanitization needed
    if (config.startingVolume) {
      this.elementRef.nativeElement.volume = validateAndPrepareStartingVideoVolume(config.startingVolume);
    }
  }
}