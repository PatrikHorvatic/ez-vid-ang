import { AfterViewInit, booleanAttribute, ChangeDetectionStrategy, Component, ElementRef, inject, input, OnChanges, OnDestroy, OnInit, signal, SimpleChanges, viewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';
import { EvaKeyboardShortcutsConfiguration, EvaStorageConfiguration, EvaTrack, EvaVideoElementConfiguration, EvaVideoSource, validateAndTransformStorageKey } from '../../types';
import { DEFAULT_STORAGE_KEY } from '../../constants';
import { prepareDefaultKeyboardShortcutsConfiguration, prepareDefaultStorageConfiguration, validateAndTransformEvaKeyboardShortcutsConfiguration, validateAndTransformEvaStorageConfiguration, validateTracks } from '../../utils/utilities';
import { EvaCueChangeDirective } from '../directives/cue-change';
import { EvaKeyboardShortcuts } from "../directives/keyboard-shortcuts";
import { EvaMediaEventListenersDirective } from '../directives/media-event-listeners';
import { EvaVideoConfigurationDirective } from '../directives/video-configuration';
import { ConfigurationStorage } from "../directives/configuration-storage";
import { EvaConfigurationStorage } from '../../api/configuration-storage';

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
  imports: [EvaMediaEventListenersDirective,
    EvaVideoConfigurationDirective,
    EvaCueChangeDirective, EvaKeyboardShortcuts, ConfigurationStorage],
  templateUrl: './player.html',
  styleUrl: './player.scss',
  providers: [EvaApi, EvaFullscreenAPI, EvaConfigurationStorage],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EvaPlayer implements AfterViewInit, OnChanges, OnDestroy, OnInit {

  /** The scoped `EvaApi` instance provided to this player's component subtree. */
  public playerMainAPI = inject(EvaApi);

  /** The scoped `EvaFullscreenAPI` instance provided to this player's component subtree. */
  public playerFullscreenAPI = inject(EvaFullscreenAPI);

  /**
   * Unique identifier for this player instance.
   *
   * **Required.** Used to distinguish multiple player instances on the same page.
   */
  public readonly id = input.required<string>();

  /**
   * The list of video sources to load into the player.
   *
   * **Required.** Each source should include at minimum a `src` and `type`.
   */
  public readonly evaVideoSources = input.required<EvaVideoSource[]>();

  /**
   * Configuration object applied to the native `<video>` element.
   * Passed through to `EvaVideoConfigurationDirective`.
   *
   * @default {}
   */
  public readonly evaVideoConfiguration = input<EvaVideoElementConfiguration>({});

  /**
   * Enables keyboard shortcuts on the player.
   * When `true`, the `EvaKeyboardShortcuts` directive listens for `keydown` events on the document.
   *
   * @default false
   */
  public readonly evaKeyboardShortcutsEnabled = input<boolean>(false);

  /**
   * Enables localStorage persistence for user preferences (volume, playback speed).
   * See `evaLocalStorageConfiguration` for granular control.
   *
   * @default false
   */
  public readonly evaLocalStorageEnabled = input<boolean, boolean>(false, { transform: booleanAttribute });

  /**
   * Prefix for localStorage keys. Use different values to isolate
   * preferences across multiple player instances on the same origin.
   *
   * @default "EVA_PLAYER_CONFIGURATION"
   */
  public readonly evaLocalStorageKey = input<string, string>(DEFAULT_STORAGE_KEY, { transform: validateAndTransformStorageKey });

  /**
   * Controls which preferences are persisted to localStorage.
   * Each flag can be toggled at runtime.
   *
   * @default { volume: false, playbackSpeed: false }
   */
  public readonly evaLocalStorageConfiguration = input<Required<EvaStorageConfiguration>, EvaStorageConfiguration>(prepareDefaultStorageConfiguration(), { transform: validateAndTransformEvaStorageConfiguration });

  /**
   * Key binding configuration for keyboard shortcuts.
   * Partial configs are merged with defaults via `validateAndTransformEvaKeyboardShortcutsConfiguration`.
   *
   * @default prepareDefaultKeyboardShortcutsConfiguration()
   */
  public readonly evaKeyboardShortcutsConfiguration = input<Required<EvaKeyboardShortcutsConfiguration>, EvaKeyboardShortcutsConfiguration>(prepareDefaultKeyboardShortcutsConfiguration(), { transform: validateAndTransformEvaKeyboardShortcutsConfiguration });

  /**
   * List of subtitle/text tracks to attach to the video element.
   * Validated and transformed via `validateTracks`.
   * Changes at runtime are forwarded to `EvaApi.videoTracksSubject` via `ngOnChanges`.
   *
   * @default []
   */
  public readonly evaVideoTracks = input<EvaTrack[], EvaTrack[]>([], { transform: validateTracks });

  /**
   * Text displayed inside the `<video>` element for browsers that do not support HTML5 video.
   *
   * @default "I'm sorry; your browser doesn't support HTML video."
   */
  public readonly evaNotSupportedText = input<string>("I'm sorry; your browser doesn't support HTML video.");

  /**
   * Reference to the native `<video>` element rendered in the template.
   * Assigned to `EvaApi` in `ngAfterViewInit`.
   */
  private readonly evaVideoElement = viewChild.required<ElementRef<HTMLVideoElement>>('evaVideoElement');


  /** Subscription to `EvaApi.videoSubtitlesSubject`. Keeps `activeSubtitleLabel` in sync. */
  private subtitleChangeSubject: Subscription | null = null;

  /** The label of the currently active subtitle track. Used by cue-change directive activation. */
  protected readonly activeSubtitleLabel = signal<string | null>(null);

  /**
   * Responds to runtime changes of `evaVideoTracks`.
   * Forwards the updated track list to `EvaApi.videoTracksSubject` so that
   * child components (e.g. `eva-track-selector`) stay in sync.
   *
   * @param changes - The `SimpleChanges` map provided by Angular.
   */
  public ngOnChanges(changes: SimpleChanges): void {
    if (changes["evaVideoTracks"]) {
      this.playerMainAPI.updateAndPrepareTracks(changes["evaVideoTracks"].currentValue as EvaTrack[]);
    }
  }

  public ngOnInit(): void {
    const defaultTrack = this.evaVideoTracks().find(t => t.default && t.kind === 'subtitles');
    if (defaultTrack) {
      this.activeSubtitleLabel.set(defaultTrack.label ?? null);
    }
  }

  /**
   * Assigns the native `<video>` element to `EvaApi` and signals that the player
   * is ready for use. Also logs the presence of any HLS or DASH streaming directives.
   */
  public ngAfterViewInit(): void {
    this.playerMainAPI.assignElementToApi(this.evaVideoElement().nativeElement);
    this.subtitleChangeSubject = this.playerMainAPI.videoSubtitlesSubject.subscribe(a => {
      if (a) {
        if (a.id !== "off") {
          this.activeSubtitleLabel.set(a.label);
        } else {
          this.activeSubtitleLabel.set(null);
          this.playerMainAPI.onCueChange(null);
        }
      }
    });
  }

  public ngOnDestroy(): void {
    this.subtitleChangeSubject?.unsubscribe();
    this.playerFullscreenAPI.destroy();
    this.playerMainAPI.destroy();
  }

  /** Called by `EvaVideoConfigurationDirective` after initial config is applied. Triggers `EvaApi.onPlayerReady()`. */
  protected videoConfigReady(): void {
    this.playerMainAPI.onPlayerReady();
  }

}