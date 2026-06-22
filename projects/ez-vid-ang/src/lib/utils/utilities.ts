import { EvaKeyboardShortcutsConfiguration, EvaTrack } from "../types";

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
			console.warn(`Duplicate track found: ${key}. Removing duplicate.`);
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
		backwardSeconds: 10,
		forwardSeconds: 10,
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
		backwardSeconds: (conf.backwardSeconds && conf.backwardSeconds > 0) ? conf.backwardSeconds : 10,
		forwardSeconds: (conf.forwardSeconds && conf.forwardSeconds > 0) ? conf.forwardSeconds : 10,
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