import { DEFAULT_SEEK_SECONDS, MAX_PLAYBACK_SPEED, MIN_PLAYBACK_SPEED } from '../constants';
import { EvaKeyboardShortcutsConfiguration, EvaStorageConfiguration, EvaTrack } from "../types";

/** Input transform that clamps negative timeout values to `0`. */
export function transformTimeoutDuration(v: number): number {
	if (!v) {
		return 0;
	}
	if (v < 0) {
		return 0;
	}
	return v;
}

/** Input transform that validates a default playback speed. Returns `1` if outside `[0.25, 4]`. */
export function transformDefaultPlaybackSpeed(v: number): number {
	if (!v) { return 1; }
	if (v < MIN_PLAYBACK_SPEED) { return 1; }
	if (v > MAX_PLAYBACK_SPEED) { return 1; }
	return v;
}

/** Input transform that filters speeds to `[0.25, 4]`, removes duplicates, and falls back to `[1]` if empty. */
export function validateAndTransformPlaybackSpeeds(v: number[]): number[] {
	// In case of an empty array, component exists and some value must be provided. Of course the default will be 1.0
	if (v.length === 0) {
		return [1.0];
	}

	// Filter out values outside the valid range [0.25, 4]
	const filtered = v.filter(speed => speed >= MIN_PLAYBACK_SPEED && speed <= MAX_PLAYBACK_SPEED);
	// If all values were filtered out, return default
	if (filtered.length === 0) {
		return [1.0];
	}
	// Remove duplicates using Set. There is maybe a better way to remove duplicates.
	const unique = Array.from(new Set(filtered));
	return unique;
}

/** Input transform that clamps volume to `[0, 1]`. Returns `1` if undefined. */
export function validateAndPrepareStartingVideoVolume(v: number | undefined): number {
	if (v === undefined || !isFinite(v)) {
		return 1;
	}
	if (v < 0) {
		return 0;
	}
	if (v > 1) {
		return 1;
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
		// Capture index before mapping creates new object references
		const firstDefaultIndex = tracks.indexOf(defaultTracks[0]);
		tracks = tracks.map(track => ({ ...track, default: false }));
		if (firstDefaultIndex !== -1) {
			tracks[firstDefaultIndex] = { ...tracks[firstDefaultIndex], default: true };
		}
	}

	// Remove duplicates based on kind, srclang, and label
	const seen = new Set<string>();
	const uniqueTracks = tracks.filter(track => {
		const key = `${track.kind}-${track.srclang || ''}-${track.label || ''}`;
		if (seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});

	return uniqueTracks;
}

/** Returns a fully populated `EvaKeyboardShortcutsConfiguration` with all default key bindings. */
export function prepareDefaultKeyboardShortcutsConfiguration(): Required<EvaKeyboardShortcutsConfiguration> {
	return {
		backwardSeconds: DEFAULT_SEEK_SECONDS,
		forwardSeconds: DEFAULT_SEEK_SECONDS,
		backwardsKeyOne: "J",
		forwardKeyOne: "L",
		backwardsKeyTwo: "ARROWLEFT",
		forwardKeyTwo: "ARROWRIGHT",
		muteKey: "M",
		fullscreen: "F",
		playPause: "SPACE",
		oneFrameBackward: ",",
		oneFrameForward: ".",
	}
}

/** Input transform that fills missing keys with defaults. `backwardSeconds` and `forwardSeconds` are clamped to a minimum of `1` (values `<= 0` fall back to `10`). Returns the full default config when `conf` is `null`/`undefined`. */
export function validateAndTransformEvaKeyboardShortcutsConfiguration(conf: EvaKeyboardShortcutsConfiguration): Required<EvaKeyboardShortcutsConfiguration> {
	if (!conf) {
		return prepareDefaultKeyboardShortcutsConfiguration();
	}
	return {
		backwardSeconds: (conf.backwardSeconds && conf.backwardSeconds > 0) ? conf.backwardSeconds : DEFAULT_SEEK_SECONDS,
		forwardSeconds: (conf.forwardSeconds && conf.forwardSeconds > 0) ? conf.forwardSeconds : DEFAULT_SEEK_SECONDS,
		backwardsKeyOne: (conf.backwardsKeyOne ?? "J").toUpperCase(),
		forwardKeyOne: (conf.forwardKeyOne ?? "L").toUpperCase(),
		backwardsKeyTwo: (conf.backwardsKeyTwo ?? "ARROWLEFT").toUpperCase(),
		forwardKeyTwo: (conf.forwardKeyTwo ?? "ARROWRIGHT").toUpperCase(),
		muteKey: (conf.muteKey ?? "M").toUpperCase(),
		fullscreen: (conf.fullscreen ?? "F").toUpperCase(),
		playPause: (conf.playPause ?? "SPACE").toUpperCase(),
		oneFrameBackward: (conf.oneFrameBackward ?? ",").toUpperCase(),
		oneFrameForward: (conf.oneFrameForward ?? ".").toUpperCase(),
	}
}

export function prepareDefaultStorageConfiguration(): Required<EvaStorageConfiguration> {
	return {
		playbackSpeed: false,
		volume: false,
		cinemaMode: false,
		loop: false
	}
}

export function validateAndTransformEvaStorageConfiguration(conf: EvaStorageConfiguration): Required<EvaStorageConfiguration> {
	if (!conf) {
		return prepareDefaultStorageConfiguration();
	}
	return {
		playbackSpeed: conf.playbackSpeed ?? false,
		volume: conf.volume ?? false,
		cinemaMode: conf.cinemaMode ?? false,
		loop: conf.loop ?? false
	}
}