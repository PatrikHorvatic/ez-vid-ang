import { AfterViewInit, Component, ElementRef, inject, input, OnChanges, OnDestroy, QueryList, signal, SimpleChanges, viewChild, viewChildren, WritableSignal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';
import { EvaTrack, EvaVideoElementConfiguration, EvaVideoSource } from '../../types';
import { validateTracks } from '../../utils/utilities';
import { EvaMediaEventListenersDirective } from '../directives/media-event-listeners.directive';
import { EvaVideoConfigurationDirective } from '../directives/video-configuration.directive';

/**
 * Root player component for the Eva video player.
 *
 * `EvaPlayer` is the top-level host of the player. It owns the `EvaApi` and
 * `EvaFullscreenAPI` provider scope, meaning all child components and directives
 * that inject these services will receive the instance created here, scoped to
 * this player. This allows multiple independent player instances on the same page.
 *
 * Responsibilities:
 * - Provides `EvaApi` and `EvaFullscreenAPI` to the component subtree.
 * - Assigns the native `<video>` element to `EvaApi` after the view initializes.
 * - Signals player readiness via `EvaApi.onPlayerReady()`.
 * - Propagates `evaVideoTracks` changes to `EvaApi.videoTracksSubject` at runtime.
 * - Optionally integrates HLS or DASH streaming via `EvaHlsDirective` / `EvaDashDirective`
 *   (injected optionally — absent if neither streaming directive is present).
 *
 * @example
 * <eva-player
 *   id="main-player"
 *   [evaVideoSources]="sources"
 *   [evaVideoConfiguration]="{ autoplay: true, muted: true }"
 *   [evaVideoTracks]="tracks"
 * />
 */
@Component({
  selector: 'eva-player',
  templateUrl: './player.html',
  styleUrl: './player.scss',
  imports: [EvaMediaEventListenersDirective, EvaVideoConfigurationDirective],
  providers: [EvaApi, EvaFullscreenAPI]
})
export class EvaPlayer implements AfterViewInit, OnChanges, OnDestroy {

  /** The scoped `EvaApi` instance provided to this player's component subtree. */
  public playerMainAPI = inject(EvaApi);

  /** The scoped `EvaFullscreenAPI` instance provided to this player's component subtree. */
  public playerFullscreenAPI = inject(EvaFullscreenAPI);

  /**
   * Optionally injected HLS streaming directive.
   * Present only when `evaHls` is applied to the `<video>` element inside this player.
   */
  // private hlsDirective = inject(EvaHlsDirective, { optional: true });

  /**
   * Optionally injected DASH streaming directive.
   * Present only when `evaDash` is applied to the `<video>` element inside this player.
   */
  // private dashDirective = inject(EvaDashDirective, { optional: true });

  /**
   * Unique identifier for this player instance.
   *
   * **Required.** Used to distinguish multiple player instances on the same page.
   */
  readonly id = input.required<string>();

  /**
   * The list of video sources to load into the player.
   *
   * **Required.** Each source should include at minimum a `src` and `type`.
   */
  readonly evaVideoSources = input.required<EvaVideoSource[]>();

  /**
   * Configuration object applied to the native `<video>` element.
   * Passed through to `EvaVideoConfigurationDirective`.
   *
   * @default {}
   */
  readonly evaVideoConfiguration = input<EvaVideoElementConfiguration>({});

  /**
   * List of subtitle/text tracks to attach to the video element.
   * Validated and transformed via `validateTracks`.
   * Changes at runtime are forwarded to `EvaApi.videoTracksSubject` via `ngOnChanges`.
   *
   * @default []
   */
  readonly evaVideoTracks = input<EvaTrack[], EvaTrack[]>([], { transform: validateTracks });

  /**
   * Text displayed inside the `<video>` element for browsers that do not support HTML5 video.
   *
   * @default "I'm sorry; your browser doesn't support HTML video."
   */
  readonly evaNotSupportedText = input<string>("I'm sorry; your browser doesn't support HTML video.");

  // readonly evaBuffering = viewChild<EvaBufferingComponent>('evaBuffering');

  /**
   * Reference to the native `<video>` element rendered in the template.
   * Assigned to `EvaApi` in `ngAfterViewInit`.
   */
  private readonly evaVideoElement = viewChild.required<ElementRef<HTMLVideoElement>>('evaVideoElement');

  // readonly evaVideoSources = viewChildren<QueryList<HTMLSourceElement>>("evaVideoSources");

  /**
   * References to the `<track>` elements rendered in the template for subtitle support.
   */
  readonly evaVideoTrackElements = viewChildren<QueryList<HTMLTrackElement>>("evaVideoTracks");


  protected subtitlesPadding: WritableSignal<string> = signal("10px");
  private controlsContainerHidding: Subscription | null = null;

  /**
   * Responds to runtime changes of `evaVideoTracks`.
   * Forwards the updated track list to `EvaApi.videoTracksSubject` so that
   * child components (e.g. `eva-track-selector`) stay in sync.
   *
   * @param changes - The `SimpleChanges` map provided by Angular.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes["evaVideoTracks"]) {
      this.playerMainAPI.videoTracksSubject.next(changes["evaVideoTracks"].currentValue);
    }
  }

  /**
   * Assigns the native `<video>` element to `EvaApi` and signals that the player
   * is ready for use. Also logs the presence of any HLS or DASH streaming directives.
   */
  ngAfterViewInit(): void {
    this.playerMainAPI.assignElementToApi(this.evaVideoElement().nativeElement);
    this.playerMainAPI.onPlayerReady();
    // console.log(this.hlsDirective);
    // console.log(this.dashDirective);

    this.controlsContainerHidding = this.playerMainAPI.componentsContainerVisibilityStateSubject.subscribe(hidden => {
      // console.log(hidden);

      if (hidden) {
        this.subtitlesPadding.set("10px");
      }
      else {
        this.subtitlesPadding.set("var(--eva-subtitle-offset)");
      }
    });
  }

  /** Reserved for future teardown logic. */
  ngOnDestroy(): void {
    this.controlsContainerHidding?.unsubscribe();
    this.playerFullscreenAPI.destroy();
    this.playerMainAPI.destroy();
  }
}