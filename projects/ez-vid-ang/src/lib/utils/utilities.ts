import { EvaVideoElementConfiguration, EvaVideoSource, EvaVideoTrack } from "../types";

export function videoTrackDefaultSetter(v: Array<EvaVideoTrack>): EvaVideoTrack[] {
	if (!v) {
		return [];
	}
	let ind = v.findIndex(el => el.default);
	if (ind === -1) {
		v[0].default = true;
	}
	return v;
}

export function videoSourceDefaultSetter(v: Array<EvaVideoSource>): EvaVideoSource[] {
	return v;
}

export function transformTimeoutDuration(v: number): number {
	if (!v) {
		return 0;
	}
	if (v < 0) {
		return 0;
	}
	return v;
}

export function transformDefaultPlaybackSpeed(v: number): number {
	return v;
}

export function validateAndTransformPlaybackSpeeds(v: Array<number>): Array<number> {
	// in case of an empty array, component exists and some value must be provided. Of course the default will be 1.0
	if (v.length === 0) {
		return [1.0];
	}

	// Filter out values outside the valid range [0.25, 4]
	const filtered = v.filter(speed => speed >= 0.25 && speed <= 4);
	// If all values were filtered out, return default
	if (filtered.length === 0) {
		return [1.0];
	}
	return filtered;

}

export function videoConfigurationDefaultSetter(v: EvaVideoElementConfiguration | undefined): EvaVideoElementConfiguration {
	if (!v) {
		return {
			width: window.innerWidth,
			height: window.innerHeight,
			autoplay: false,
			controls: false,
			controlsList: "play timeline volume",
			crossorigin: "anonymous",
			disablePictureInPicture: false,
			disableRemotePlayback: false,
			loop: false,
			muted: false,
			playinline: false,
			poster: "",
			preload: "auto",

		}
	}
	if (!v.width) {
		v.width = window.innerWidth;
	}
	if (!v.height) {
		v.height = window.innerHeight;
	}
	if (!v.autoplay) {
		v.autoplay = false;
	}
	if (!v.controls) {
		v.controls = false;
	}
	if (!v.controlsList) {
		v.controlsList = "play timeline volume";
	}
	if (!v.crossorigin) {
		v.crossorigin = "anonymous";
	}
	if (!v.disablePictureInPicture) {
		v.disablePictureInPicture = false;
	}
	if (!v.disableRemotePlayback) {
		v.disableRemotePlayback = false;
	}
	if (!v.loop) {
		v.loop = false;
	}
	if (!v.muted) {
		v.muted = false;
	}
	if (!v.playinline) {
		v.playinline = false;
	}
	if (!v.poster) {
		v.poster = "";
	}
	if (!v.preload) {
		v.preload = "auto";
	}
	return v;
}

