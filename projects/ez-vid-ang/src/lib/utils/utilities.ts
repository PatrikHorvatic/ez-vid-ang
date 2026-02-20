import { EvaTrack, EvaVideoElementConfiguration, EvaVideoSource } from "../types";

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
	if (!v) { return 1; }
	if (v < 0.25) { return 1; }
	if (v > 4) { return 1; }
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
	// Remove duplicates using Set. There is maybe a better way to remove duplicates.
	const unique = Array.from(new Set(filtered));
	return unique;
}

export function validateAndPrepareStartingVideoVolume(v: number | undefined): number {
	if (v === undefined) {
		return 0.75;
	}
	if (v < 0) {
		return 0;
	}
	if (v > 1) {
		return 1;
	}
	return v;
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
	if (!v.startingVolume) {
		v.startingVolume = 0.75;
	}
	return v;
}

/**
 * Validates and transforms an array of tracks
 * - Ensures only one track has default=true
 * - Ensures no duplicate tracks (same kind, srclang, label)
 * - Validates that subtitles have srclang
 */
export function validateTracks(tracks: EvaTrack[]): EvaTrack[] {
	if (tracks.length === 0) {
		return [];
	}

	// Validate: only one default track allowed
	const defaultTracks = tracks.filter(track => track.default === true);
	if (defaultTracks.length > 1) {
		console.warn('Multiple tracks marked as default. Only the first will be used.');
		// Reset all defaults, then set only the first one
		tracks = tracks.map(track => ({ ...track, default: false }));
		const firstDefaultIndex = tracks.findIndex(track => defaultTracks.includes(track));
		if (firstDefaultIndex !== -1) {
			tracks[firstDefaultIndex] = { ...tracks[firstDefaultIndex], default: true };
		}
	}

	// Remove duplicates based on kind, srclang, and label
	const seen = new Set<string>();
	const uniqueTracks = tracks.filter(track => {
		const key = `${track.kind}-${track.srclang || ''}-${track.label || ''}`;
		if (seen.has(key)) {
			console.warn(`Duplicate track found: ${key}. Removing duplicate.`);
			return false;
		}
		seen.add(key);
		return true;
	});

	return uniqueTracks;
}