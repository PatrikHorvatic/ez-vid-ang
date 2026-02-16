import { EventEmitter, Injectable, signal, WritableSignal } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { EvaState, EvaTrack } from '../types';

@Injectable({
	providedIn: 'root',
})
export class EvaApi {
	public id = Math.random();

	/**Very important! */
	public assignedVideoElement!: HTMLVideoElement;

	playerReadyEvent: EventEmitter<EvaApi> = new EventEmitter<EvaApi>(true);
	public isPlayerReady = false;
	public isBuffering: WritableSignal<boolean> = signal(false);

	protected isMetadataLoaded = false;
	private hasStartedPlaying = false;

	public isLive: WritableSignal<boolean> = signal(false);
	public time: WritableSignal<{ current: number, total: number, remaining: number }> = signal({
		current: 0,
		remaining: 0,
		total: 0
	});

	/**Used for all the component where video state is important */
	public videoStateSubject = new BehaviorSubject<EvaState>(EvaState.LOADING);
	public videoVolumeSubject = new BehaviorSubject<number | null>(null);
	public playbackRateSubject = new BehaviorSubject<number | null>(null);
	public videoTracksSubject = new BehaviorSubject<EvaTrack[]>([]);
	/**Flag for current value of video state. */
	private currentVideoState: EvaState = EvaState.LOADING;

	public triggerUserInteraction = new Subject<MouseEvent | TouchEvent | PointerEvent>()

	// Add buffering detection variables
	private bufferingTimeout?: ReturnType<typeof setTimeout>;
	private lastPlayPos = 0;
	private currentPlayPos = 0;

	/**Called from play-pause component. */
	public playOrPauseVideo() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		if (this.assignedVideoElement.paused) {
			this.assignedVideoElement.play();
			this.currentVideoState = EvaState.PLAYING;
			this.videoStateSubject.next(this.currentVideoState);
		}
		else {
			this.assignedVideoElement.pause();
			this.currentVideoState = EvaState.PAUSED;
			this.videoStateSubject.next(this.currentVideoState);
		}
	}

	//Called from event listener
	public erroredVideo() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.currentVideoState = EvaState.ERROR;
		this.videoStateSubject.next(this.currentVideoState);
		this.isBuffering.set(false); // Stop buffering on error
	}

	//Called from event listener
	public loadedVideoMetadata(e: Event) {
		this.isMetadataLoaded = true;
		this.time.set({
			current: 0,
			remaining: this.assignedVideoElement.duration === Infinity
				? 0
				: Number.isNaN(this.assignedVideoElement.duration) ? 0 : this.assignedVideoElement.duration,
			total: this.assignedVideoElement.duration
		});

		this.isLive.set(this.assignedVideoElement.duration === Infinity);
	}

	// Called from event listener - WAITING event
	public videoWaiting() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		// Only show buffering if we've started playing (not initial load)
		if (this.hasStartedPlaying) {
			this.isBuffering.set(true);
		}
	}

	// Called from event listener - CAN_PLAY event
	public videoCanPlay() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.isBuffering.set(false);
	}

	// Called from event listener - PLAYING event
	public playingVideo() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.hasStartedPlaying = true;
		this.isBuffering.set(false);

		if (this.bufferingTimeout) {
			clearTimeout(this.bufferingTimeout);
		}
	}

	// Called from event listener - STALLED event
	public videoStalled() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.isBuffering.set(true);
	}

	// Called from event listener - SEEKING event
	public videoSeeking() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.isBuffering.set(true);
	}

	// Called from event listener - SEEKED event
	public videoSeeked() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.isBuffering.set(false);
	}

	public updateVideoTime() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}

		const end = this.assignedVideoElement.buffered.length - 1;
		const crnt = this.assignedVideoElement.currentTime;
		this.time.update(a => {
			return {
				current: crnt,
				total: a.total,
				remaining: this.getVideoDuration() - crnt
			}
		});

		// Advanced buffering detection
		this.detectBuffering(crnt);
	}

	/**
	 * Detect buffering by checking if video playback position is advancing
	 */
	private detectBuffering(currentTime: number) {
		// Don't check buffering if video is paused or ended
		if (this.assignedVideoElement.paused || this.assignedVideoElement.ended) {
			this.isBuffering.set(false);
			if (this.bufferingTimeout) {
				clearTimeout(this.bufferingTimeout);
			}
			return;
		}

		// Don't check buffering if readyState indicates video can play
		if (this.assignedVideoElement.readyState >= 3) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
			this.isBuffering.set(false);
		}

		// Update play positions
		this.currentPlayPos = currentTime;

		// Clear existing timeout
		if (this.bufferingTimeout) {
			clearTimeout(this.bufferingTimeout);
		}

		// Only check for stalling if we've had time to advance
		this.bufferingTimeout = setTimeout(() => {
			// If current position hasn't advanced and video should be playing
			if (this.currentPlayPos === this.lastPlayPos &&
				!this.assignedVideoElement.paused &&
				!this.assignedVideoElement.ended &&
				this.assignedVideoElement.readyState < 3) { // Only if not enough data
				this.isBuffering.set(true);
			}
		}, 500); // Increased from 200ms to 500ms to avoid false positives

		this.lastPlayPos = this.currentPlayPos;
	}

	/**
	 * Check buffering status based on buffer ranges
	 */
	public checkBufferStatus(): void {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}

		// Only check if we're currently playing
		if (this.assignedVideoElement.paused || this.assignedVideoElement.ended) {
			return;
		}

		// If readyState is sufficient, we're not buffering
		if (this.assignedVideoElement.readyState >= 3) {
			this.isBuffering.set(false);
			return;
		}

		const currentTime = this.assignedVideoElement.currentTime;
		const buffered = this.assignedVideoElement.buffered;

		let hasEnoughBuffer = false;

		// Check if current time is within any buffered range
		for (let i = 0; i < buffered.length; i++) {
			if (currentTime >= buffered.start(i) && currentTime <= buffered.end(i)) {
				// Check if we have enough buffer ahead (at least 1 second)
				const bufferAhead = buffered.end(i) - currentTime;
				hasEnoughBuffer = bufferAhead > 1;
				break;
			}
		}

		// Only set to true if we don't have buffer, don't force false
		if (!hasEnoughBuffer && this.assignedVideoElement.readyState < 3) {
			this.isBuffering.set(true);
		}
	}

	public checkIfItIsLiveStram(): boolean {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return false;
		}
		return this.isLive();
	}

	/**It returns:
	 * 
	 * - a number in seconds if it has a duration
	 * - NaN if no media data is available
	 * - Infinity if it is a live stream  
	 * 
	 * https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/duration#value
	 * */
	public getVideoDuration(): number {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return NaN;
		}
		return this.assignedVideoElement.duration;
	}

	//Called from event listener
	public endedVideo() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.currentVideoState = EvaState.ENDED;
		this.videoStateSubject.next(this.currentVideoState);
		this.isBuffering.set(false); // Stop buffering when ended
	}

	//Called from event listener
	public pauseVideo() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.currentVideoState = EvaState.PAUSED;
		this.videoStateSubject.next(this.currentVideoState);
		this.isBuffering.set(false); // Stop buffering when paused
	}

	//Called from event listener
	public playVideo() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.currentVideoState = EvaState.PLAYING;
		this.videoStateSubject.next(this.currentVideoState);
	}

	//Called from event listener
	public playbackRateVideoChanged(e: Event) {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.playbackRateSubject.next(this.assignedVideoElement.playbackRate);
	}

	//Called from event listener
	public setPlaybackSpeed(speed: number) {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.assignedVideoElement.playbackRate = speed;
	}

	public getPlaybackSpeed(): number {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return 1;
		}
		return this.assignedVideoElement.playbackRate;
	}


	// called from component
	public getVideoVolume(): number {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			// this value is default on init
			return 0.75;
		}
		return this.assignedVideoElement.volume;
	}

	// called from component
	public muteOrUnmuteVideo() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}

		// if there is any sound mute it
		if (this.assignedVideoElement.volume > 0) {
			this.assignedVideoElement.volume = 0;
		}
		else {
			this.assignedVideoElement.volume = 0.75;
		}
	}

	public setVideoVolume(volume: number) {
		this.assignedVideoElement.volume = volume;
	}

	//Called from event listener
	public volumeChanged(e: Event) {
		this.videoVolumeSubject.next(
			this.assignedVideoElement.volume
		);
	}

	public getCurrentVideoState(): EvaState {
		return this.currentVideoState;
	}

	public assignElementToApi(element: HTMLVideoElement) {
		this.assignedVideoElement = element;
	}

	public setFirstSubtitles() {

	}

	public onPlayerReady() {
		this.isPlayerReady = true;
		this.playerReadyEvent.emit(this);
	}

	private validateVideoAndPlayerBeforeAction(): boolean {
		if (!this.isPlayerReady) {
			return false;
		}
		if (!this.assignedVideoElement) {
			return false;
		}

		return true;
	}

}