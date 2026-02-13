import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { EvaState } from '../types';

@Injectable({
	providedIn: 'root',
})
export class EvaApi {
	public id = Math.random();

	public assignedVideoElement!: HTMLVideoElement;
	playerReadyEvent: EventEmitter<EvaApi> = new EventEmitter<EvaApi>(true);
	public isPlayerReady = false;

	public videoState = new BehaviorSubject<EvaState>(EvaState.LOADING);
	private currentVideoState: EvaState = EvaState.LOADING;

	public triggerUserInteraction = new Subject<MouseEvent | TouchEvent | PointerEvent>()

	public playOrPauseVideo() {
		if (!this.validateVideoAndPlayerBeforeAction()) {
			return;
		}

		if (this.assignedVideoElement.paused) {

		}

		this.assignedVideoElement.paused
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
