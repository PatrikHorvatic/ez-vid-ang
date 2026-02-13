import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { EvaState } from '../types';

@Injectable({
	providedIn: 'root',
})
export class EvaApi {
	public id = Math.random();

	/**Very important! */
	public assignedVideoElement!: HTMLVideoElement;

	playerReadyEvent: EventEmitter<EvaApi> = new EventEmitter<EvaApi>(true);
	public isPlayerReady = false;

	/**Used for all the component where video state is important */
	public videoStateSubject = new BehaviorSubject<EvaState>(EvaState.LOADING);
	public videoVolumeSubject = new BehaviorSubject<number | null>(null);
	public playbackRateSubject = new BehaviorSubject<number | null>(null);
	/**Flag for current value of video state. */
	private currentVideoState: EvaState = EvaState.LOADING;

	public triggerUserInteraction = new Subject<MouseEvent | TouchEvent | PointerEvent>()

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
		this.currentVideoState = EvaState.ENDED;
		this.videoStateSubject.next(this.currentVideoState);
	}

	//Called from event listener
	public endedVideo() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.currentVideoState = EvaState.ENDED;
		this.videoStateSubject.next(this.currentVideoState);
	}

	//Called from event listener
	public pauseVideo() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}
		this.currentVideoState = EvaState.PAUSED;
		this.videoStateSubject.next(this.currentVideoState);
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
	public playingVideo() {

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
