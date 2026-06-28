import { Injectable } from '@angular/core';

/**
 * Low-level service that reads and writes player preferences to `localStorage`.
 *
 * Provided at the component level by `EvaPlayer`. Each player instance gets its
 * own scoped service, but they all share the same `localStorage` backend — the
 * `key` parameter on each method ensures isolation.
 *
 * Keys are namespaced by appending a suffix to the caller-provided prefix:
 * - Volume → `{key}_volume`
 * - Playback speed → `{key}_playbackSpeed`
 *
 * All getters validate the stored value before returning it. Invalid, missing,
 * or out-of-range values return `null` so the caller can fall back to defaults.
 *
 * All localStorage access is wrapped in try-catch to handle restricted
 * environments (private browsing, sandboxed iframes, quota exceeded).
 */
@Injectable()
export class EvaConfigurationStorage {

	/**
	 * Persists the current volume to localStorage.
	 *
	 * @param key - The storage key prefix.
	 * @param value - Volume as a normalized value (`0`–`1`).
	 */
	public saveVolume(key: string, value: number): void {
		try {
			localStorage.setItem(`${key}_volume`, String(value));
		} catch {
			// Unavailable or quota exceeded
		}
	}

	/**
	 * Reads the saved volume from localStorage.
	 *
	 * @param key - The storage key prefix.
	 * @returns The saved volume (`0`–`1`), or `null` if missing, empty, invalid, or localStorage is unavailable.
	 */
	public getVolume(key: string): number | null {
		try {
			const raw = localStorage.getItem(`${key}_volume`);
			if (raw === null) {
				return null;
			}
			const num = Number(raw.trim());
			if (!Number.isFinite(num) || num < 0 || num > 1) {
				return null;
			}
			return num;
		} catch {
			return null;
		}
	}

	/**
	 * Persists the current playback speed to localStorage.
	 *
	 * @param key - The storage key prefix.
	 * @param value - The playback rate (e.g. `1`, `1.5`, `2`).
	 */
	public savePlaybackSpeed(key: string, value: number): void {
		try {
			localStorage.setItem(`${key}_playbackSpeed`, String(value));
		} catch {
			// Unavailable or quota exceeded
		}
	}

	/**
	 * Reads the saved playback speed from localStorage.
	 *
	 * @param key - The storage key prefix.
	 * @returns The saved speed, or `null` if missing, empty, non-finite, `<= 0`, or localStorage is unavailable.
	 */
	public getPlaybackSpeed(key: string): number | null {
		try {
			const raw = localStorage.getItem(`${key}_playbackSpeed`);
			if (raw === null) {
				return null;
			}
			const num = Number(raw.trim());
			if (!Number.isFinite(num) || num <= 0) {
				return null;
			}
			return num;
		} catch {
			return null;
		}
	}

	/**
	 * Persists the cinema mode state to localStorage.
	 *
	 * @param key - The storage key prefix.
	 * @param value - `true` if cinema mode is active.
	 */
	public saveCinemaMode(key: string, value: boolean): void {
		try {
			localStorage.setItem(`${key}_cinemaMode`, String(value));
		} catch {
			// Unavailable or quota exceeded
		}
	}

	/**
	 * Reads the saved cinema mode state from localStorage.
	 *
	 * @param key - The storage key prefix.
	 * @returns `true` or `false`, or `null` if missing or localStorage is unavailable.
	 */
	public getCinemaMode(key: string): boolean | null {
		try {
			const raw = localStorage.getItem(`${key}_cinemaMode`);
			if (raw === null) {
				return null;
			}
			if (raw === 'true') {
				return true;
			}
			if (raw === 'false') {
				return false;
			}
			return null;
		} catch {
			return null;
		}
	}

	/**
	 * Persists the loop state to localStorage.
	 *
	 * @param key - The storage key prefix.
	 * @param value - `true` if loop is active.
	 */
	public saveLoop(key: string, value: boolean): void {
		try {
			localStorage.setItem(`${key}_loop`, String(value));
		} catch {
			// Unavailable or quota exceeded
		}
	}

	/**
	 * Reads the saved loop state from localStorage.
	 *
	 * @param key - The storage key prefix.
	 * @returns `true` or `false`, or `null` if missing or localStorage is unavailable.
	 */
	public getLoop(key: string): boolean | null {
		try {
			const raw = localStorage.getItem(`${key}_loop`);
			if (raw === null) {
				return null;
			}
			if (raw === 'true') {
				return true;
			}
			if (raw === 'false') {
				return false;
			}
			return null;
		} catch {
			return null;
		}
	}

}
