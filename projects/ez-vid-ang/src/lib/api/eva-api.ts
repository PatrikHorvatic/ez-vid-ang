import { EventEmitter, Injectable, signal } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { EvaState, EvaChapterMarker, EvaKeyboardShortcutsConfiguration, EvaQualityLevel, EvaScreenshotEvent, EvaTrack, EvaTrackInternal } from '../types';
import { MAX_DIGIT_KEY, DIGIT_DIVISOR, READY_STATE_HAVE_FUTURE_DATA, BUFFERING_DETECTION_DELAY_MS, CHAPTER_UPDATE_DEBOUNCE_MS, DEFAULT_ARROW_SEEK_SECONDS, DEFAULT_UNMUTE_VOLUME, DEFAULT_IMAGE_QUALITY } from '../constants';

/**
 * Core API service for the Eva video player.
 *
 * `EvaApi` is the central state and command hub of the player. It is provided at the
 * component level by `EvaPlayer`, giving each player instance its own scoped service.
 * All player components and directives communicate through this service rather than
 * directly with the native `<video>` element.
 *
 * Responsibilities:
 * - Holds a reference to the assigned `HTMLVideoElement`.
 * - Tracks and broadcasts playback state, volume, buffering, time, and tracks.
 * - Exposes commands for play/pause, seek, volume, mute, and playback speed.
 * - Provides a user interaction subject for auto-hide coordination.
 * - Implements buffering detection via both native events and a position-polling fallback.
 *
 * All public methods that operate on the video element are guarded by
 * `validateVideoAndPlayerBeforeAction()`, which returns early if the player is not
 * yet ready or the video element has not been assigned.
 *
 * Buffering detection uses two complementary strategies:
 * 1. **Event-based** — reacts to `waiting`, `canplay`, `playing`, `stalled`, and `progress` events.
 * 2. **Position-polling** — on each `timeupdate`, checks whether the playback position has
 *    advanced within 500ms. If not, and `readyState < 3`, buffering is set to `true`.
 */
@Injectable()
export class EvaApi {

	/** Unique numeric identifier for this service instance. Useful for debugging multiple players. */
	public id = Math.random();

	/**
	 * Reference to the native `<video>` element managed by this player instance.
	 * Assigned via `assignElementToApi()` in `EvaPlayer.ngAfterViewInit`.
	 *
	 * **Important:** Do not access this before `isPlayerReady` is `true`.
	 */
	public assignedVideoElement: HTMLVideoElement | null = null;

	/**
	 * Emits this `EvaApi` instance when the player is fully initialized and the
	 * video element has been assigned. Components that need to defer setup until
	 * the player is ready should subscribe to this event.
	 */
	public playerReadyEvent: EventEmitter<EvaApi> = new EventEmitter<EvaApi>(true);

	/** Whether the player has been fully initialized and the video element assigned. */
	public isPlayerReady = false;

	/** Whether the video is currently buffering. Updated by event handlers and position-polling. */
	public readonly isBuffering = signal(true);

	/** Whether the video has enough data to begin playback (`canplay` event has fired). */
	public readonly canPlay = signal(false);

	/** Whether a seek operation is currently in progress. */
	public readonly isSeeking = signal(false);

	/** Whether the video metadata (`duration`, `dimensions`, tracks) has been loaded. */
	protected isMetadataLoaded = false;

	/** Whether the video has started playing at least once. Used to suppress buffering indicators during initial load. */
	private hasStartedPlaying = false;

	/**
	 * When `true`, the video will resume playback after the current seek operation completes.
	 * Set by `EvaScrubBar` when the user releases a drag seek while the video was playing.
	 */
	public pendingPlayAfterSeek = false;

	/** Whether the current source is a live stream (`duration === Infinity`). Set from `loadedmetadata`. */
	public readonly isLive = signal(false);

	/**
	 * Current playback time state. Updated on every `timeupdate` event.
	 * - `current` — current playback position in seconds
	 * - `total` — total video duration in seconds (`Infinity` for live streams)
	 * - `remaining` — seconds remaining until end
	 */
	public readonly time = signal({
		current: 0,
		remaining: 0,
		total: 0
	});

	/**
	 * Broadcasts the current `EvaState` to all subscribed components.
	 * Initial value is `EvaState.LOADING`.
	 */
	public videoStateSubject = new BehaviorSubject<EvaState>(EvaState.LOADING);

	/**
	 * Broadcasts the current video volume as a normalized value (`0` to `1`).
	 * Emits `null` until the first volume change occurs.
	 */
	public videoVolumeSubject = new BehaviorSubject<number | null>(null);

	public componentsContainerVisibilityStateSubject = new BehaviorSubject<boolean>(false);

	public controlsSelectorComponentActive = new BehaviorSubject<boolean>(false);

	/**
	 * Broadcasts the current playback rate (e.g. `1`, `1.5`, `2`).
	 * Emits `null` until the first rate change occurs.
	 */
	public playbackRateSubject = new BehaviorSubject<number | null>(null);

	/** Broadcasts the current list of available `EvaTrack` objects. Updated by `EvaPlayer` on input changes. */
	public videoTracksSubject = new BehaviorSubject<EvaTrack[] | null>([]);

	public videoSubtitlesSubject = new BehaviorSubject<EvaTrackInternal | null>(null);

	/**
	 * Broadcasts the video element's `TimeRanges` buffer object on each `progress` event.
	 * Subscribed to by `EvaScrubBarBufferingTimeComponent`.
	 */
	public videoBufferSubject = new BehaviorSubject<TimeRanges | null>(null);

	/**
	 * Emits `null` on every `timeupdate` event.
	 * Subscribed to by components that need to react to time changes (e.g. buffering time display),
	 * typically with throttling applied.
	 */
	public videoTimeChangeSubject = new BehaviorSubject<number>(0);

	/**
	  * The list of available quality levels for the current stream.
	  * Populated by `registerQualityLevels()` after the streaming manifest is parsed.
	  * Subscribed to by `EvaQualitySelector` to populate its dropdown.
	  */
	public qualityLevelsSubject = new BehaviorSubject<EvaQualityLevel[]>([]);


	/**
	 * Used when user changes current time on the scrub track through interaction.
	 * Chapter marker gets calculated inside the component.
	 */
	public activeChapterSubject = new BehaviorSubject<EvaChapterMarker | null>(null);

	public chapterMarkerChangesSubject = new BehaviorSubject<EvaChapterMarker[]>([]);

	/**
	  * The currently selected quality level index.
	  * `-1` represents Auto (ABR). Updated by `setQuality()`.
	  */
	public readonly currentQualityIndex = signal(-1);

	/** The current `EvaState` value, mirrored as a plain field for synchronous reads. */
	private currentVideoState: EvaState = EvaState.LOADING;

	/**
	 * Subject that emits on user interaction events (mouse move, click, touch).
	 * Subscribed to by `EvaControlsContainerComponent` and `EvaScrubBar` for auto-hide.
	 * Published to by `EvaUserInteractionEventsDirective`.
	 */
	public triggerUserInteraction = new Subject<MouseEvent | TouchEvent | PointerEvent>();


	public readonly currentSubtitleCue = signal<string | null>(null);


	/** The active `PictureInPictureWindow` instance. `null` when PiP is not active. */
	private pipWindow: PictureInPictureWindow | null = null;

	/**
	 * Broadcasts the current Picture-in-Picture state.
	 * Emits `true` when the player enters PiP, `false` when it leaves.
	 * Subscribed to by `EvaPictureInPicture` to keep its icon state in sync.
	 */
	public pictureInPictureSubject = new BehaviorSubject<boolean>(false);

	/** Broadcasts the current loop state. Updated by `EvaVideoConfigurationDirective` and `EvaLoop`. */
	public loopSubject = new BehaviorSubject<boolean>(false);

	/** Broadcasts the cinema mode state. Updated by `EvaCinemaMode` and `ConfigurationStorage`. */
	public cinemaModeSubject = new BehaviorSubject<boolean>(false);

	/** Broadcasts the keyboard shortcuts overlay open/close state. Toggled by `EvaKeyboardShortcuts` on `?` key. */
	public keyboardShortcutsOverlaySubject = new BehaviorSubject<boolean>(false);

	/** Holds the resolved keyboard shortcuts configuration. Published by `EvaKeyboardShortcuts` on init. */
	public keyboardShortcutsConfigSubject = new BehaviorSubject<Required<EvaKeyboardShortcutsConfiguration> | null>(null);

	public lastActiveVolume = 1;


	// ─── Buffering Detection ──────────────────────────────────────────────────

	/** Timeout reference used by the position-polling buffering detection. Cleared on each `timeupdate`. */
	private bufferingTimeout: ReturnType<typeof setTimeout> | undefined;

	/** The playback position recorded at the end of the previous `timeupdate` cycle. */
	private lastPlayPos = 0;

	/** The playback position recorded at the start of the current `timeupdate` cycle. */
	private currentPlayPos = 0;

	public isActiveChapterPresent = false;

	/** When `true`, chapters were provided via the `evaChapters` input and VTT-parsed chapters should not overwrite them. */
	public hasExternalChapters = false;
	private trackTimeout: ReturnType<typeof setTimeout> | null = null;

	public updateAndPrepareTracks(tracks: EvaTrack[]): void {
		this.videoTracksSubject.next(tracks);

		if (this.trackTimeout) {
			clearTimeout(this.trackTimeout);
		}

		this.trackTimeout = setTimeout(() => {
			if (this.validateVideoAndPlayerBeforeAction() && !this.hasExternalChapters) {
				const listOfChapters = this.loadChaptersFromTrack();
				this.chapterMarkerChangesSubject.next(listOfChapters);
				if (!this.isLive()) {
					const currentTime = Math.floor(this.time().current);
					const chapter = listOfChapters.find(c => currentTime >= c.startTime && currentTime < c.endTime);
					this.activeChapterSubject.next(chapter ? chapter : null);
				}
			}
		}, CHAPTER_UPDATE_DEBOUNCE_MS);


	}

	/**
	  * Called when the active text track fires a `cuechange` event.
	  * Reads the first active cue from the track and updates `currentSubtitleCue`.
	  *
	  * @param track - The `TextTrack` whose cues changed.
	  */
	public onCueChange(track: TextTrack | null): void {
		if (!track) {
			this.currentSubtitleCue.set(null);
			return;
		}
		if (!track.activeCues || track.activeCues.length === 0) {
			this.currentSubtitleCue.set(null);
			return;
		}
		const cue = track.activeCues[0];
		if (cue instanceof VTTCue) {
			this.currentSubtitleCue.set(cue.text);
		}
	}

	/**
	  * Internal reference to the streaming library's quality setter function.
	  * Registered by `EvaHlsDirective` or `EvaDashDirective` via `registerQualityFn()`.
	  * `null` when no streaming directive is active.
	  */
	private qualityFn: ((qualityIndex: number) => void) | null = null;

	/**
	  * Registers the streaming library's quality setter function with the API.
	  * Called by `EvaHlsDirective` or `EvaDashDirective` after the player is created.
	  *
	  * @param fn - A function that accepts a quality index and switches the active level.
	  *   Pass `-1` to restore Auto (ABR) mode.
	  */
	public registerQualityFn(fn: (qualityIndex: number) => void): void {
		this.qualityFn = fn;
	}

	/**
	  * Registers the available quality levels parsed from the stream manifest.
	  * Called by `EvaHlsDirective` or `EvaDashDirective` after `MANIFEST_PARSED`.
	  * Broadcasts the levels to `qualityLevelsSubject`.
	  *
	  * @param levels - The parsed quality levels including the synthetic Auto option.
	  */
	public registerQualityLevels(levels: EvaQualityLevel[]): void {
		this.qualityLevelsSubject.next(levels);
	}

	/**
	 * Switches to the given quality level by delegating to the registered `qualityFn`.
	 * Updates `currentQualityIndex` to reflect the active selection.
	 * No-ops if no streaming directive has registered a quality function.
	 *
	 * @param qualityIndex - The `qualityIndex` from an `EvaQualityLevel` object.
	 *   Pass `-1` for Auto (ABR) mode.
	 */
	public setQuality(qualityIndex: number): void {
		if (!this.qualityFn) {
			console.warn('[EvaApi] No quality function registered. Is a streaming directive active?');
			return;
		}
		this.currentQualityIndex.set(qualityIndex);
		this.qualityFn(qualityIndex);
	}

	// ─── Playback Commands ────────────────────────────────────────────────────

	/**
	 * Toggles play/pause on the video element.
	 * Updates `currentVideoState` and `videoStateSubject` accordingly.
	 * Called from `EvaPlayPause` and `EvaOverlayPlay`.
	 */
	public playOrPauseVideo(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		if (this.assignedVideoElement!.paused) {
			this.assignedVideoElement!.play().catch((e: unknown) => {
				if (e instanceof Error && e.name !== 'AbortError') { throw e; }
			});
			this.currentVideoState = EvaState.PLAYING;
			this.videoStateSubject.next(this.currentVideoState);
		}
		else {
			this.assignedVideoElement!.pause();
			this.currentVideoState = EvaState.PAUSED;
			this.videoStateSubject.next(this.currentVideoState);
		}
	}

	/**
	 * Seeks forward by N seconds, clamped to the total duration.
	 * Updates `time` signal immediately for responsive UI feedback.
	 * Called from `EvaScrubBar` keyboard handler.
	 */
	public seekForward(n = DEFAULT_ARROW_SEEK_SECONDS): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		const newTime = Math.min(this.time().current + n, this.time().total);
		this.assignedVideoElement!.currentTime = newTime;
		this.time.update(a => ({ ...a, current: newTime, remaining: a.total - newTime }));
	}

	/**
	 * Seeks backward by N seconds, clamped to a minimum of `0`.
	 * Updates `time` signal immediately for responsive UI feedback.
	 * Called from `EvaScrubBar` keyboard handler.
	 */
	public seekBack(n = DEFAULT_ARROW_SEEK_SECONDS): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		const newTime = Math.max(this.time().current - n, 0);
		this.assignedVideoElement!.currentTime = newTime;
		this.time.update(a => ({ ...a, current: newTime, remaining: a.total - newTime }));
	}

	/**
	 * Jumps to a percentage of total duration based on a digit key.
	 * `"0"` seeks to 0%, `"5"` to 50%, `"9"` to 90%, etc.
	 * Ignored for live streams (duration is `Infinity`).
	 * Updates `time` signal immediately for responsive UI feedback.
	 *
	 * @param key - A single digit character (`"0"`–`"9"`).
	 */
	public jumpToVideoPercentage(key: string): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		if (this.isLive()) {
			return;
		}
		const digit = parseInt(key, 10);
		if (isNaN(digit) || digit < 0 || digit > MAX_DIGIT_KEY) {
			return;
		}
		const newTime = (digit / DIGIT_DIVISOR) * this.time().total;
		this.assignedVideoElement!.currentTime = newTime;
		this.time.update(a => ({ ...a, current: newTime, remaining: a.total - newTime }));
	}

	/**
	 * Sets the video playback rate.
	 * Called from `EvaPlaybackSpeed` when the user selects a speed.
	 *
	 * @param speed - The desired playback rate (e.g. `0.5`, `1`, `1.5`, `2`).
	 */
	public setPlaybackSpeed(speed: number): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.assignedVideoElement!.playbackRate = speed;
	}

	/**
	 * Returns the current playback rate.
	 * Falls back to `1` if the player is not yet ready.
	 */
	public getPlaybackSpeed(): number {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return 1;
		}
		return this.assignedVideoElement!.playbackRate;
	}

	/**
	 * Returns the current video volume as a normalized value (`0` to `1`).
	 * Falls back to `1` (the default initial volume) if the player is not yet ready.
	 * Called from `EvaMute` and `EvaVolume` on initialization.
	 */
	public getVideoVolume(): number {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return 1;
		}
		return this.assignedVideoElement!.volume;
	}

	/**
	 * Toggles mute/unmute. Saves the current volume before muting (when > 0)
	 * and restores it on unmute. Falls back to `0.75` if `lastActiveVolume`
	 * is `0` (e.g. volume was dragged to zero before muting).
	 */
	public muteOrUnmuteVideo(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}

		if (this.assignedVideoElement!.volume > 0) {
			this.lastActiveVolume = this.assignedVideoElement!.volume;
			this.assignedVideoElement!.volume = 0;
		}
		else {
			this.assignedVideoElement!.volume = this.lastActiveVolume > 0 ? this.lastActiveVolume : DEFAULT_UNMUTE_VOLUME;
		}
	}

	/**
	 * Sets the video volume, clamping the value to `[0, 1]`.
	 * Called from `EvaVolume` during drag and keyboard interactions.
	 *
	 * @param volume - The desired volume as a normalized value (`0`–`1`).
	 */
	public setVideoVolume(volume: number): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		if (volume < 0) {
			this.assignedVideoElement!.volume = 0;
			this.lastActiveVolume = 0;
		}
		else if (volume > 1) {
			this.assignedVideoElement!.volume = 1;
			this.lastActiveVolume = 1;
		}
		else {
			this.assignedVideoElement!.volume = volume;
			this.lastActiveVolume = volume;
		}
	}

	// ─── Event Listener Callbacks ─────────────────────────────────────────────

	/**
	 * Called from `EvaMediaEventListenersDirective` on the `error` event.
	 * Sets state to `EvaState.ERROR` and clears the buffering indicator.
	 */
	public erroredVideo(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.currentVideoState = EvaState.ERROR;
		this.videoStateSubject.next(this.currentVideoState);
		this.isBuffering.set(false);
	}

	/**
	 * Called from `EvaMediaEventListenersDirective` on the `loadedmetadata` event.
	 * Initializes the `time` signal with the video duration and sets `isLive` if
	 * the duration is `Infinity`.
	 *
	 * @param e - The native `loadedmetadata` event.
	 */
	public loadedVideoMetadata(_e: Event): void {
		if (!this.assignedVideoElement) { return; }
		this.isMetadataLoaded = true;
		const duration = this.assignedVideoElement.duration;
		const isValidDuration = duration !== Infinity && !Number.isNaN(duration);
		this.time.set({
			current: 0,
			remaining: isValidDuration ? duration : 0,
			total: isValidDuration || duration === Infinity ? duration : 0
		});

		this.isLive.set(this.assignedVideoElement.duration === Infinity);
	}

	/**
	 * Called from `EvaMediaEventListenersDirective` on the `waiting` event.
	 * Shows the buffering indicator only if playback has already started,
	 * to avoid showing it during the initial load.
	 */
	public videoWaiting(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		if (this.hasStartedPlaying) {
			this.isBuffering.set(true);
		}
	}

	/**
	 * Called from `EvaMediaEventListenersDirective` on the `canplay` event.
	 * Marks the video as ready to play and clears the buffering indicator.
	 */
	public videoCanPlay(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.canPlay.set(true);
		this.isBuffering.set(false);
	}

	/**
	 * Called from `EvaMediaEventListenersDirective` on the `playing` event.
	 * Marks `hasStartedPlaying`, clears buffering, and cancels any pending buffering timeout.
	 */
	public playingVideo(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.hasStartedPlaying = true;
		this.isBuffering.set(false);

		if (this.bufferingTimeout) {
			clearTimeout(this.bufferingTimeout);
		}
	}

	/**
	 * Called from `EvaMediaEventListenersDirective` on the `stalled` event.
	 * Sets buffering to `true` to reflect that the browser has stalled while fetching data.
	 */
	public videoStalled(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.isBuffering.set(true);
	}

	/**
	 * Called from `EvaScrubBar` on mouse interaction.
	 * Sets `isSeeking` to `true` if the video is not live and is ready to play.
	 *
	 * @param e - The native `MouseEvent` from the scrub bar.
	 */
	public seekOnScrubEvent(_e: MouseEvent): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		if (this.isLive() || !this.canPlay()) {
			return;
		}
		this.isSeeking.set(true);
	}

	/**
	 * Called from `EvaMediaEventListenersDirective` on the `seeking` event.
	 * Sets both `isSeeking` and `isBuffering` to `true`.
	 */
	public videoSeeking(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.isSeeking.set(true);
		this.isBuffering.set(true);
	}

	/**
	 * Called from `EvaMediaEventListenersDirective` on the `seeked` event.
	 * Clears `isSeeking` and resumes playback if `pendingPlayAfterSeek` is set.
	 * Ignores `AbortError` which can occur if another seek interrupts the play call.
	 */
	public videoSeeked(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.isSeeking.set(false);

		if (this.pendingPlayAfterSeek) {
			this.pendingPlayAfterSeek = false;
			this.assignedVideoElement!.play().catch((e: unknown) => {
				if (e instanceof Error && e.name !== 'AbortError') { throw e; }
			});
		}
	}

	/**
	 * Called from `EvaMediaEventListenersDirective` on the `timeupdate` event.
	 * Updates `time`, emits `videoTimeChangeSubject`, and runs the position-polling
	 * buffering detection check.
	 */
	public updateVideoTime(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.videoTimeChangeSubject.next(this.videoTimeChangeSubject.value + 1);

		const crnt = this.assignedVideoElement!.currentTime;
		const duration = this.getVideoDuration();
		const remaining = this.isLive() || !Number.isFinite(duration) ? 0 : duration - crnt;
		this.time.update(a => ({
			current: crnt,
			total: a.total,
			remaining
		}));

		if (!this.isLive()) {
			if (this.isActiveChapterPresent) {
				const currentTime = Math.floor(this.time().current);
				const listOfChapters = this.chapterMarkerChangesSubject.value;
				const chapter = listOfChapters.find(c => currentTime >= c.startTime && currentTime < c.endTime);
				// Prevent triggering unneccesery change detection in signals.
				if (this.activeChapterSubject.value !== chapter) {
					this.activeChapterSubject.next(chapter ? chapter : null);
				}
			}
		}
		this.detectBuffering(crnt);
	}

	/**
	 * Called from `EvaMediaEventListenersDirective` on the `ended` event.
	 * Sets state to `EvaState.ENDED` and clears the buffering indicator.
	 */
	public endedVideo(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.currentVideoState = EvaState.ENDED;
		this.videoStateSubject.next(this.currentVideoState);
		this.isBuffering.set(false);
	}

	/**
	 * Called from `EvaMediaEventListenersDirective` on the `pause` event.
	 * Sets state to `EvaState.PAUSED` and clears the buffering indicator.
	 */
	public pauseVideo(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.currentVideoState = EvaState.PAUSED;
		this.videoStateSubject.next(this.currentVideoState);
		this.isBuffering.set(false);
	}

	/**
	 * Called from `EvaMediaEventListenersDirective` on the `play` event.
	 * Sets state to `EvaState.PLAYING`.
	 */
	public playVideo(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.currentVideoState = EvaState.PLAYING;
		this.videoStateSubject.next(this.currentVideoState);
	}

	/**
	 * Called from `EvaMediaEventListenersDirective` on the `ratechange` event.
	 * Broadcasts the new playback rate to `playbackRateSubject`.
	 *
	 * @param e - The native `ratechange` event.
	 */
	public playbackRateVideoChanged(_e: Event): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.playbackRateSubject.next(this.assignedVideoElement!.playbackRate);
	}

	/**
	 * Called from `EvaMediaEventListenersDirective` on the `volumechange` event.
	 * Broadcasts the new volume to `videoVolumeSubject`.
	 *
	 * @param e - The native `volumechange` event.
	 */
	public volumeChanged(_e: Event): void {
		if (!this.validateVideoAndPlayerBeforeAction()) { return; }
		this.videoVolumeSubject.next(
			this.assignedVideoElement!.volume
		);
	}

	// ─── Buffering Detection ──────────────────────────────────────────────────

	/**
	 * Position-polling buffering detection. Called on every `timeupdate`.
	 *
	 * Clears buffering immediately if:
	 * - The video is paused or ended.
	 * - `readyState >= 3` (HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA).
	 *
	 * Otherwise, schedules a 500ms timeout. If the playback position has not advanced
	 * and `readyState < 3`, sets buffering to `true`. The 500ms delay reduces false
	 * positives from brief network hiccups.
	 *
	 * @param currentTime - The current playback position in seconds.
	 */
	private detectBuffering(currentTime: number): void {
		if (this.assignedVideoElement!.paused || this.assignedVideoElement!.ended) {
			this.isBuffering.set(false);
			if (this.bufferingTimeout) {
				clearTimeout(this.bufferingTimeout);
			}
			return;
		}

		// Don't check buffering if readyState indicates video can play
		if (this.assignedVideoElement!.readyState >= READY_STATE_HAVE_FUTURE_DATA) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
			this.isBuffering.set(false);
		}

		this.currentPlayPos = currentTime;

		if (this.bufferingTimeout) {
			clearTimeout(this.bufferingTimeout);
		}

		this.bufferingTimeout = setTimeout(() => {
			if (this.currentPlayPos === this.lastPlayPos &&
				!this.assignedVideoElement!.paused &&
				!this.assignedVideoElement!.ended &&
				this.assignedVideoElement!.readyState < READY_STATE_HAVE_FUTURE_DATA) {
				this.isBuffering.set(true);
			}
		}, BUFFERING_DETECTION_DELAY_MS); // 500ms to avoid false positives from brief stalls

		this.lastPlayPos = this.currentPlayPos;
	}

	/**
	 * Buffer range-based buffering detection. Called from `EvaMediaEventListenersDirective`
	 * on the `progress` event.
	 *
	 * Emits the current `TimeRanges` to `videoBufferSubject`, then checks whether the
	 * current playback position has at least 1 second of buffer ahead. If not, and
	 * `readyState < 3`, sets buffering to `true`. Does not force buffering to `false`
	 * to avoid conflicting with other detection strategies.
	 *
	 * No-ops if the video is paused, ended, or `readyState >= 3`.
	 */
	public checkBufferStatus(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.videoBufferSubject.next(this.assignedVideoElement!.buffered);

		if (this.assignedVideoElement!.paused || this.assignedVideoElement!.ended) {
			return;
		}

		if (this.assignedVideoElement!.readyState >= READY_STATE_HAVE_FUTURE_DATA) {
			this.isBuffering.set(false);
			return;
		}

		const { currentTime } = (this.assignedVideoElement!);
		const { buffered } = (this.assignedVideoElement!);

		let hasEnoughBuffer = false;

		for (let i = 0; i < buffered.length; i++) {
			if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
				const bufferAhead = buffered.end(i) - currentTime;
				hasEnoughBuffer = bufferAhead > 1;
				break;
			}
		}

		if (!hasEnoughBuffer && this.assignedVideoElement!.readyState < READY_STATE_HAVE_FUTURE_DATA) {
			this.isBuffering.set(true);
		}
	}

	// ─── Picture in picture ────────────────────────────────────────────────────────────

	/**
	 * Toggles Picture-in-Picture mode for the assigned video element.
	 *
	 * - If this player's video element is currently in PiP, exits PiP via
	 *   `document.exitPictureInPicture()`.
	 * - If another element is currently in PiP, exits that first, then enters PiP
	 *   on this player's video element.
	 * - If PiP is not active, enters PiP via `requestPictureInPicture()`.
	 *
	 * No-ops if:
	 * - The player is not yet ready.
	 * - `document.pictureInPictureEnabled` is `false` (API not supported or blocked).
	 * - `assignedVideoElement.disablePictureInPicture` is `true`.
	 *
	 * State is tracked via native `enterpictureinpicture` / `leavepictureinpicture`
	 * events, not by the Promise resolution, to correctly handle external PiP changes.
	 *
	 * @returns A `Promise<void>` that resolves when the PiP state change completes.
	 */
	public async changePictureInPictureStatus(): Promise<void> {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}

		if (!document.pictureInPictureEnabled) {
			console.warn('[EvaApi] Picture-in-Picture is not supported or is disabled in this browser.');
			return;
		}

		if (this.assignedVideoElement!.disablePictureInPicture) {
			console.warn('[EvaApi] Picture-in-Picture is disabled on this video element.');
			return;
		}

		try {
			if (document.pictureInPictureElement === this.assignedVideoElement) {
				// This player is already in PiP — exit
				await document.exitPictureInPicture();
			} else {
				// Another element may be in PiP — the browser handles exiting it automatically
				// Before entering PiP on a new element, but we exit explicitly for safety
				if (document.pictureInPictureElement) {
					await document.exitPictureInPicture();
				}
				await this.assignedVideoElement!.requestPictureInPicture();
			}
		} catch (error) {
			console.warn('[EvaApi] Picture-in-Picture toggle failed:', error);
		}
	}

	public assignPictureInPictureWindow(p: PictureInPictureEvent): void {
		this.pipWindow = p.pictureInPictureWindow;
		this.pictureInPictureSubject.next(true);
	}

	public removePictureInPictureWindow(_p: PictureInPictureEvent): void {
		this.pipWindow = null;
		this.pictureInPictureSubject.next(false);
	}



	// ─── Screenshot ──────────────────────────────────────────────────────────

	/**
	 * Captures the current video frame by drawing it to an offscreen canvas.
	 *
	 * Returns a promise that resolves with an `EvaScreenshotEvent` containing
	 * the frame as a `Blob` and data URL, plus the capture timestamp and
	 * dimensions. Both `blob` and `dataUrl` are `null` if the canvas is
	 * tainted (cross-origin video without `crossorigin="anonymous"`).
	 *
	 * Returns `null` if the player is not ready, the video element is not
	 * assigned, or the video has no rendered frames (`videoWidth === 0`).
	 *
	 * @param format - Image MIME type (default `"image/png"`).
	 * @param quality - Quality for lossy formats, `0`–`1` (default `0.92`). Ignored for PNG.
	 */
	public async captureScreenshot(format = 'image/png', quality = DEFAULT_IMAGE_QUALITY): Promise<EvaScreenshotEvent | null> {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return null;
		}
		const video = this.assignedVideoElement!;
		const width = video.videoWidth;
		const height = video.videoHeight;
		if (width === 0 || height === 0) {
			return null;
		}

		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return null;
		}

		ctx.drawImage(video, 0, 0, width, height);
		const currentTime = video.currentTime;

		let dataUrl: string | null = null;
		try {
			dataUrl = canvas.toDataURL(format, quality);
		} catch {
			// Tainted canvas (cross-origin)
		}

		return await new Promise<EvaScreenshotEvent>(resolve => {
			try {
				canvas.toBlob(
					(blob: Blob | null) => {
						resolve({ blob, dataUrl, currentTime, width, height });
					},
					format,
					quality
				);
			} catch {
				resolve({ blob: null, dataUrl, currentTime, width, height });
			}
		});
	}

	// ─── Utilities ────────────────────────────────────────────────────────────

	/**
	 * Returns the video duration in seconds.
	 *
	 * Possible return values:
	 * - A positive number — the duration in seconds for VOD content.
	 * - `NaN` — no media data is available yet.
	 * - `Infinity` — the source is a live stream.
	 *
	 * Returns `NaN` if the player is not yet ready.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/duration#value
	 */
	public getVideoDuration(): number {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return NaN;
		}
		return this.assignedVideoElement!.duration;
	}

	/** Returns the current `EvaState` synchronously. */
	public getCurrentVideoState(): EvaState {
		return this.currentVideoState;
	}

	/**
	 * Assigns the native `<video>` element to this service instance.
	 * Called from `EvaPlayer.ngAfterViewInit`.
	 *
	 * @param element - The native `HTMLVideoElement` rendered by `EvaPlayer`.
	 */
	public assignElementToApi(element: HTMLVideoElement): void {
		this.assignedVideoElement = element;
	}

	// ---------------- SUBTITLES -------------------------

	public subtitlesChanged(label: EvaTrackInternal | null): void {
		this.videoSubtitlesSubject.next(label);
	}


	/**
	 * Marks the player as ready and emits `playerReadyEvent`.
	 * Called from `EvaPlayer.ngAfterViewInit` after `assignElementToApi`.
	 * Components that deferred setup (e.g. `EvaUserInteractionEventsDirective`)
	 * will receive this event and complete their initialization.
	 */
	public onPlayerReady(): void {
		this.isPlayerReady = true;
		this.playerReadyEvent.emit(this);
	}

	/**
	 * Guards all video operations by verifying that the player is ready
	 * and the video element has been assigned.
	 *
	 * @returns `true` if it is safe to operate on the video element, `false` otherwise.
	 */
	public validateVideoAndPlayerBeforeAction(): boolean {
		if (!this.isPlayerReady) {
			return false;
		}
		if (!this.assignedVideoElement) {
			return false;
		}

		return true;
	}

	/**
	  * Cleans up all resources held by this `EvaApi` instance.
	  * Called from `EvaPlayer.ngOnDestroy`.
	  *
	  * Performs the following cleanup:
	  * - Completes all `BehaviorSubject` and `Subject` streams so that any lingering
	  *   subscribers receive a completion signal and are automatically unsubscribed.
	  * - Clears the position-polling buffering timeout to prevent it from firing
	  *   after the player has been destroyed.
	  * - Clears the registered quality setter function reference.
	  * - Marks the player as not ready to block any late-arriving callbacks from
	  *   operating on the now-detached video element.
	*/
	public destroy(): void {
		// Mark player as no longer ready — blocks any late callbacks
		this.isPlayerReady = false;

		// Cancel any pending buffering detection timeout
		if (this.bufferingTimeout) {
			clearTimeout(this.bufferingTimeout);
			this.bufferingTimeout = undefined;
		}

		if (this.trackTimeout) {
			clearTimeout(this.trackTimeout);
		}

		if (this.pipWindow) {
			this.pipWindow = null;
		}

		// Clear the registered streaming quality function
		this.qualityFn = null;

		// Complete all subjects — notifies subscribers and prevents further emissions
		this.pictureInPictureSubject.complete();
		this.loopSubject.complete();
		this.cinemaModeSubject.complete();
		this.videoStateSubject.complete();
		this.videoVolumeSubject.complete();
		this.playbackRateSubject.complete();
		this.videoTracksSubject.complete();
		this.videoSubtitlesSubject.complete();
		this.videoBufferSubject.complete();
		this.videoTimeChangeSubject.complete();
		this.qualityLevelsSubject.complete();
		this.activeChapterSubject.complete();
		this.chapterMarkerChangesSubject.complete();
		this.componentsContainerVisibilityStateSubject.complete();
		this.controlsSelectorComponentActive.complete();
		this.keyboardShortcutsOverlaySubject.complete();
		this.keyboardShortcutsConfigSubject.complete();
		this.triggerUserInteraction.complete();
		this.playerReadyEvent.complete();
	}

	/**
	   Scans the video element's text tracks for a `chapters` or `metadata` track
	   and parses its cues into `EvaChapterMarker` objects.
	   If cues are not yet available, waits for the track's `load` event.
	  */
	private loadChaptersFromTrack(): EvaChapterMarker[] {
		const { textTracks } = (this.assignedVideoElement!);
		let l: EvaChapterMarker[] = [];
		for (let i = 0; i < textTracks.length; i++) {
			const track = textTracks[i];
			if (track.kind === 'metadata' || track.kind === 'chapters') {
				track.mode = 'hidden';
				if (track.cues && track.cues.length > 0) {
					l = this.parseCues(track.cues);
				}
				break;
			}
		}

		return l;
	}

	/**
	  * Converts a `TextTrackCueList` into an array of `EvaChapterMarker` objects
	  * and updates the `chapters` signal inside the Angular zone.
	  *
	  * @param cues - The list of VTT cues to parse.
	  */
	private parseCues(cues: TextTrackCueList): EvaChapterMarker[] {
		const parsed: EvaChapterMarker[] = [];
		for (let i = 0; i < cues.length; i++) {
			const cue = cues[i];
			if (cue instanceof VTTCue) {
				parsed.push({
					startTime: cue.startTime ? cue.startTime : 0,
					endTime: cue.endTime,
					title: cue.text
				});
			}
		}
		return parsed;
	}
}