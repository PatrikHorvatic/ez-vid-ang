import { DEFAULT_SEEK_SECONDS } from '../constants';

/**Contains aria values fullscreen component works with. */
export type EvaFullscreenAria = {
	exitFullscreen?: string,
	enterFullscreen?: string,
}

/**Transforms all properties to required */
export type EvaFullscreenAriaTransformed = {
	exitFullscreen: string,
	enterFullscreen: string,
}

/**Transforms aria input to an object with all the values.
 *
 * Default values:
 * - enterFullscreen: 'Enter fullscreen',
 * - exitFullscreen: 'Exit fullscreen'
 */
export function transformEvaFullscreenAria(v: EvaFullscreenAria | undefined): EvaFullscreenAriaTransformed {
	if (!v) {
		return {
			enterFullscreen: 'Enter fullscreen',
			exitFullscreen: 'Exit fullscreen'
		};
	}
	return {
		enterFullscreen: v.enterFullscreen ?? "Enter fullscreen",
		exitFullscreen: v.exitFullscreen ?? "Exit fullscreen"
	}
}


/**Contains aria values mute component works with */
export type EvaMuteAria = {
	/**Default value is mute*/
	ariaLabel?: string,
	/**Default is muted/unmuted */
	ariaValueTextMuted?: string
	ariaValueTextUnmuted?: string
}

/**Transform all properties to required */
export type EvaMuteAriaTransformed = {
	ariaLabel: string,
	ariaValueTextMuted: string,
	ariaValueTextUnmuted: string,
}

/**Transforms aria input to an object with all the values */
export function transformEvaMuteAria(v: EvaMuteAria | undefined): EvaMuteAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "mute",
			ariaValueTextMuted: "Muted",
			ariaValueTextUnmuted: "Unmuted",
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "mute",
		ariaValueTextMuted: v.ariaValueTextMuted ?? "Muted",
		ariaValueTextUnmuted: v.ariaValueTextUnmuted ?? "Unmuted",
	}
}

export function validateAndTransformVolumeRange(v: number): number {
	if (!v) {
		return 0;
	}
	if (v < 0) {
		return 0;
	}
	if (v > 1) {
		return 1;
	}
	return v;
}

export type EvaPlayPauseAria = {
	ariaLabel?: {
		play?: string,
		pause?: string
	},
	ariaValueText?: {
		playing?: string,
		loading?: string,
		paused?: string,
		ended?: string,
		errored?: string
	}
}

export type EvaPlayPauseAriaTransformed = {
	ariaLabel: {
		play: string,
		pause: string
	},
	ariaValueText: {
		playing: string,
		loading: string,
		paused: string,
		ended: string,
		errored: string
	}
}

export function transformEvaPlayPauseAria(v: EvaPlayPauseAria | undefined): EvaPlayPauseAriaTransformed {
	if (!v) {
		return {
			ariaLabel: {
				play: "play",
				pause: "pause"
			},
			ariaValueText: {
				ended: "ended",
				errored: "errored",
				paused: "paused",
				loading: "loading",
				playing: "playing"
			}
		}
	}

	return {
		ariaLabel: {
			play: v.ariaLabel?.play ?? "play",
			pause: v.ariaLabel?.pause ?? "pause",
		},
		ariaValueText: {
			ended: v.ariaValueText?.ended ?? "ended",
			errored: v.ariaValueText?.errored ?? "errored",
			paused: v.ariaValueText?.paused ?? "paused",
			loading: v.ariaValueText?.loading ?? "loading",
			playing: v.ariaValueText?.playing ?? "playing",
		}
	}

}

export type EvaPictureInPictureAria = {
	ariaLabel?: string,
	ariaValueText?: {
		ariaLabelActivated?: string,
		ariaLabelDeactivated?: string,
	}
}

export type EvaPictureInPictureAriaTransformed = {
	ariaLabel: string,
	ariaValueText: {
		ariaLabelActivated: string,
		ariaLabelDeactivated: string,
	}
}

export function transformEvaPictureInPictureAria(v: EvaPictureInPictureAria | undefined): EvaPictureInPictureAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Picture in picture",
			ariaValueText: {
				ariaLabelActivated: "Picture in picture is active",
				ariaLabelDeactivated: "Picture in picture is inactive",
			}
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Picture in picture",
		ariaValueText: {
			ariaLabelActivated: v.ariaValueText?.ariaLabelActivated ?? "Picture in picture is active",
			ariaLabelDeactivated: v.ariaValueText?.ariaLabelDeactivated ?? "Picture in picture is inactive",
		}
	}
}

export type EvaForwardAria = {
	ariaLabel?: string,
}

export type EvaForwardAriaTransformed = {
	ariaLabel: string,
}

export function validateAndTransformEvaForwardAndBackwardSeconds(v: number): number {
	if (!v) { return DEFAULT_SEEK_SECONDS; }
	if (v === Infinity) { return DEFAULT_SEEK_SECONDS; }
	if (v <= 0) { return DEFAULT_SEEK_SECONDS; }

	return v;
}

export function transformEvaForwardAria(v: EvaForwardAria | undefined): EvaForwardAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Forward 10 seconds"
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Forward 10 seconds"
	}
}
export type EvaBackwardAria = {
	ariaLabel?: string,
}

export type EvaBackwardAriaTransformed = {
	ariaLabel: string,
}

export function transformEvaBackwardAria(v: EvaBackwardAria | undefined): EvaBackwardAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Backward 10 seconds"
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Backward 10 seconds"
	}
}

export type EvaPlaybackSpeedAria = {
	ariaLabel?: string,
}

export type EvaPlaybackSpeedAriaTransformed = {
	ariaLabel: string,
}

export function transformEvaPlaybackSpeedAria(v: EvaPlaybackSpeedAria | undefined): EvaPlaybackSpeedAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Playback speed"
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Playback speed"
	}
}


/**Aria labels for your timers. Based on time property input you should add value to the property:
 *
 * - current -> ariaLabelCurrent
 * - total -> ariaLabelTotal
 * - remaining -> ariaLabelRemaining
 *
 * ariaLabel property inside the time display component has a default values for each time property.
 */
export type EvaTimeDisplayAria = {
	ariaLabelCurrent?: string,
	ariaLabelTotal?: string,
	ariaLabelRemaining?: string
}

export type EvaTimeDisplayAriaTransformed = {
	ariaLabelCurrent: string,
	ariaLabelTotal: string,
	ariaLabelRemaining: string
}

export function transformEvaTimeDisplayAria(v: EvaTimeDisplayAria | undefined): EvaTimeDisplayAriaTransformed {
	if (!v) {
		return {
			ariaLabelCurrent: "Current time display",
			ariaLabelTotal: "Duration display",
			ariaLabelRemaining: "Remaining time display"
		}
	}

	return {
		ariaLabelCurrent: v.ariaLabelCurrent ?? "Current time display",
		ariaLabelTotal: v.ariaLabelTotal ?? "Duration display",
		ariaLabelRemaining: v.ariaLabelRemaining ?? "Remaining time display"
	}
}

export type EvaActiveChapterAria = {
	ariaLabel?: string
}

export type EvaActiveChapterAriaTransformed = {
	ariaLabel: string
}

export function transformEvaActiveChapterAria(v: EvaActiveChapterAria | undefined): EvaActiveChapterAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Active chapter"
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Active chapter"
	}
}

export type EvaControlsDividerAria = {
	ariaLabel?: string
}

export type EvaControlsDividerAriaTransformed = {
	ariaLabel: string
}

export function transformEvaControlsDividerAria(v: EvaControlsDividerAria | undefined): EvaControlsDividerAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Controls divider"
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Controls divider"
	}
}

export type EvaScrubBarAria = {
	ariaLabel?: string
}

export type EvaScrubBarAriaTransformed = {
	ariaLabel: string
}

export function transformEvaScrubBarAria(v: EvaScrubBarAria | undefined): EvaScrubBarAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Scrub bar"
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Scrub bar"
	}
}

export type EvaVolumeAria = {
	ariaLabel?: string
}

export type EvaVolumeAriaTransformed = {
	ariaLabel: string
}

export function transformEvaVolumeAria(v: EvaVolumeAria | undefined): EvaVolumeAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Volume control"
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Volume control"
	}
}


export type EvaQualityAria = {
	ariaLabel?: string
}

export type EvaAudioTrackSelectorAria = {
	ariaLabel?: string;
}

export type EvaOverlayPlayAria = {
	ariaLabel?: string;
}

export type EvaOverlayPlayAriaTransformed = {
	ariaLabel: string;
}

export function transformEvaOverlayPlayAria(v: EvaOverlayPlayAria | undefined): EvaOverlayPlayAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Overlay play"
		};
	}

	return {
		ariaLabel: v.ariaLabel ?? "Overlay play"
	};
}

// ─── EvaLoop ─────────────────────────────────────────────────────────────────

export type EvaLoopAria = {
	ariaLabel?: string,
	ariaValueText?: {
		active?: string,
		inactive?: string,
	}
}

export type EvaLoopAriaTransformed = {
	ariaLabel: string,
	ariaValueText: {
		active: string,
		inactive: string,
	}
}

export function transformEvaLoopAria(v: EvaLoopAria | undefined): EvaLoopAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Loop",
			ariaValueText: {
				active: "Loop is on",
				inactive: "Loop is off",
			}
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Loop",
		ariaValueText: {
			active: v.ariaValueText?.active ?? "Loop is on",
			inactive: v.ariaValueText?.inactive ?? "Loop is off",
		}
	};
}

// ─── EvaDownload ────────────────────────────────────────────────────────────

export type EvaDownloadAria = {
	ariaLabel?: string
}

export type EvaDownloadAriaTransformed = {
	ariaLabel: string
}

export function transformEvaDownloadAria(v: EvaDownloadAria | undefined): EvaDownloadAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Download"
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Download"
	}
}

// ─── EvaScreenshot ──────────────────────────────────────────────────────────

export type EvaScreenshotAria = {
	ariaLabel?: string
}

export type EvaScreenshotAriaTransformed = {
	ariaLabel: string
}

export function transformEvaScreenshotAria(v: EvaScreenshotAria | undefined): EvaScreenshotAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Screenshot"
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Screenshot"
	}
}

// ─── EvaErrorOverlay ────────────────────────────────────────────────────────

export type EvaErrorOverlayAria = {
	ariaLabel?: string,
	retryAriaLabel?: string,
}

export type EvaErrorOverlayAriaTransformed = {
	ariaLabel: string,
	retryAriaLabel: string,
}

export function transformEvaErrorOverlayAria(v: EvaErrorOverlayAria | undefined): EvaErrorOverlayAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Video playback error",
			retryAriaLabel: "Retry playback",
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Video playback error",
		retryAriaLabel: v.retryAriaLabel ?? "Retry playback",
	}
}

// ─── EvaCinemaMode ──────────────────────────────────────────────────────────

export type EvaCinemaModeAria = {
	ariaLabel?: string,
	ariaValueText?: {
		active?: string,
		inactive?: string,
	}
}

export type EvaCinemaModeAriaTransformed = {
	ariaLabel: string,
	ariaValueText: {
		active: string,
		inactive: string,
	}
}

export function transformEvaCinemaModeAria(v: EvaCinemaModeAria | undefined): EvaCinemaModeAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Cinema mode",
			ariaValueText: {
				active: "Cinema mode is on",
				inactive: "Cinema mode is off",
			}
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Cinema mode",
		ariaValueText: {
			active: v.ariaValueText?.active ?? "Cinema mode is on",
			inactive: v.ariaValueText?.inactive ?? "Cinema mode is off",
		}
	}
}

// ─── EvaRemotePlayback ─────────────────────────────────────────────────────

export type EvaRemotePlaybackAria = {
	ariaLabel?: string,
	ariaValueText?: {
		disconnected?: string,
		connecting?: string,
		connected?: string,
	}
}

export type EvaRemotePlaybackAriaTransformed = {
	ariaLabel: string,
	ariaValueText: {
		disconnected: string,
		connecting: string,
		connected: string,
	}
}

export function transformEvaRemotePlaybackAria(v: EvaRemotePlaybackAria | undefined): EvaRemotePlaybackAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Cast",
			ariaValueText: {
				disconnected: "Not connected",
				connecting: "Connecting…",
				connected: "Connected",
			}
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Cast",
		ariaValueText: {
			disconnected: v.ariaValueText?.disconnected ?? "Not connected",
			connecting: v.ariaValueText?.connecting ?? "Connecting…",
			connected: v.ariaValueText?.connected ?? "Connected",
		}
	}
}

// ─── EvaSettingsPanel ──────────────────────────────────────────────────────

export type EvaSettingsPanelAria = {
	ariaLabel?: string,
}

export type EvaSettingsPanelAriaTransformed = {
	ariaLabel: string,
}

export function transformEvaSettingsPanelAria(v: EvaSettingsPanelAria | undefined): EvaSettingsPanelAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Settings",
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Settings",
	}
}


export type EvaEndedOverlayAria = {
	ariaLabel?: string,
}

export type EvaEndedOverlayAriaTransformed = {
	ariaLabel: string,
}


export function transformEvaEndedOverlayAria(v: EvaEndedOverlayAria | undefined): EvaEndedOverlayAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Video ended",
		}
	}

	return {
		ariaLabel: v.ariaLabel ?? "Video ended",
	}
}