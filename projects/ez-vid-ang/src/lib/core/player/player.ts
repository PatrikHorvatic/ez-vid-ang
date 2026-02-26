import { AfterViewInit, Component, ElementRef, inject, input, OnChanges, OnDestroy, SimpleChanges, viewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';
import { EvaTrack, EvaVideoElementConfiguration, EvaVideoSource } from '../../types';
import { validateTracks } from '../../utils/utilities';
import { EvaCueChangeDirective } from '../directives/cue-change';
import { EvaMediaEventListenersDirective } from '../directives/media-event-listeners';
import { EvaVideoConfigurationDirective } from '../directives/video-configuration';

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
  imports: [EvaMediaEventListenersDirective, EvaVideoConfigurationDirective, EvaCueChangeDirective],
  providers: [EvaApi, EvaFullscreenAPI]
})
export class EvaPlayer implements AfterViewInit, OnChanges, OnDestroy {

  /** The scoped `EvaApi` instance provided to this player's component subtree. */
  public playerMainAPI = inject(EvaApi);

  /** The scoped `EvaFullscreenAPI` instance provided to this player's component subtree. */
  public playerFullscreenAPI = inject(EvaFullscreenAPI);

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
  // private readonly evaVideoTrackElements = viewChildren<ElementRef<HTMLTrackElement>>("evaVideoTracks");


  private subtitleChangeSubject: Subscription | null = null;
  private subtitlesTimeout: ReturnType<typeof setTimeout> | null = null;
  protected activeSubtitleLabel: string | null = null;

  /**
   * Responds to runtime changes of `evaVideoTracks`.
   * Forwards the updated track list to `EvaApi.videoTracksSubject` so that
   * child components (e.g. `eva-track-selector`) stay in sync.
   *
   * @param changes - The `SimpleChanges` map provided by Angular.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes["evaVideoTracks"]) {
      //when number of tracks is change we must restart all mutation observers as some may become invalid
      this.playerMainAPI.updateAndPrepareTracks(changes["evaVideoTracks"].currentValue);

      if (!changes["evaVideoTracks"].firstChange) {
        // this.prepareSubtitles();
      }
    }
  }

  ngOnInit(): void {
    // prevent NG0100
    const defaultTrack = this.evaVideoTracks().find(t => t.default && t.kind === 'subtitles');
    if (defaultTrack) {
      this.activeSubtitleLabel = defaultTrack.label ?? null;
    }
  }

  /**
   * Assigns the native `<video>` element to `EvaApi` and signals that the player
   * is ready for use. Also logs the presence of any HLS or DASH streaming directives.
   */
  ngAfterViewInit(): void {
    this.playerMainAPI.assignElementToApi(this.evaVideoElement().nativeElement);
    this.subtitleChangeSubject = this.playerMainAPI.videoSubtitlesSubject.subscribe(a => {
      if (a) {
        // if subtitles are disabled
        if (a.id !== "off") {
          this.activeSubtitleLabel = a.label;
        }
        else {
          this.activeSubtitleLabel = null;
          this.playerMainAPI.onCueChange(null);
        }
      }
    });
  }

  /** Reserved for future teardown logic. */
  ngOnDestroy(): void {
    if (this.subtitlesTimeout) {
      clearTimeout(this.subtitlesTimeout);
    }
    this.subtitleChangeSubject?.unsubscribe();
    this.playerFullscreenAPI.destroy();
    this.playerMainAPI.destroy();
  }

  protected videoConfigReady() {
    this.playerMainAPI.onPlayerReady();
  }

}