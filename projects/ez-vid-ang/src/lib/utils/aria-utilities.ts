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
		enterFullscreen: v.enterFullscreen ? v.enterFullscreen : "Enter fullscreen",
		exitFullscreen: v.exitFullscreen ? v.exitFullscreen : "Exit fullscreen"
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
		ariaLabel: v.ariaLabel ? v.ariaLabel : "mute",
		ariaValueTextMuted: v.ariaValueTextMuted ? v.ariaValueTextMuted : "Muted",
		ariaValueTextUnmuted: v.ariaValueTextUnmuted ? v.ariaValueTextUnmuted : "Unmuted",
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
			play: v.ariaLabel?.play ? v.ariaLabel.play : "play",
			pause: v.ariaLabel?.pause ? v.ariaLabel.pause : "pause",
		},
		ariaValueText: {
			ended: v.ariaValueText?.ended ? v.ariaValueText?.ended : "ended",
			errored: v.ariaValueText?.errored ? v.ariaValueText?.errored : "errored",
			paused: v.ariaValueText?.paused ? v.ariaValueText?.paused : "paused",
			loading: v.ariaValueText?.loading ? v.ariaValueText?.loading : "loading",
			playing: v.ariaValueText?.playing ? v.ariaValueText?.playing : "playing",
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

export type EvaPictureInPictureTransformed = {
	ariaLabel: string,
	ariaValueText: {
		ariaLabelActivated: string,
		ariaLabelDeactivated: string,
	}
}

export function transformEvaPictureInPictureAria(v: EvaPictureInPictureAria | undefined): EvaPictureInPictureTransformed {
	if (!v) {
		return {
			ariaLabel: "Picture in picture",
			ariaValueText: {
				ariaLabelActivated: "Picture in picture is active",
				ariaLabelDeactivated: "Picture in picture is invactive",
			}
		}
	}

	return {
		ariaLabel: v.ariaLabel ? v.ariaLabel : "Picture in picture",
		ariaValueText: {
			ariaLabelActivated: v.ariaValueText && v.ariaValueText.ariaLabelActivated ? v.ariaValueText.ariaLabelActivated : "Picture in picture is active",
			ariaLabelDeactivated: v.ariaValueText && v.ariaValueText.ariaLabelDeactivated ? v.ariaValueText.ariaLabelDeactivated : "Picture in picture is invactive",
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
	if (!v) { return 10; }
	if (v === Infinity) { return 10; }
	if (v <= 0) { return 10; }

	return v;
}

export function transformEvaForwardAria(v: EvaForwardAria | undefined): EvaForwardAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Forward 10 seconds"
		}
	}

	return {
		ariaLabel: v.ariaLabel ? v.ariaLabel : "Forward 10 seconds"
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
		ariaLabel: v.ariaLabel ? v.ariaLabel : "Backward 10 seconds"
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
		ariaLabel: v.ariaLabel ? v.ariaLabel : "Playback speed"
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
		ariaLabelCurrent: v.ariaLabelCurrent ? v.ariaLabelCurrent : "Current time display",
		ariaLabelTotal: v.ariaLabelTotal ? v.ariaLabelTotal : "Duration display",
		ariaLabelRemaining: v.ariaLabelRemaining ? v.ariaLabelRemaining : "Remaining time display"
	}
}

export type EvaActiveChaptedAria = {
	ariaLabel?: string
}

export type EvaActiveChaptedAriaTransformed = {
	ariaLabel: string
}

export function transformEvaActiveChaptedAria(v: EvaActiveChaptedAria | undefined): EvaActiveChaptedAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "Controls divider"
		}
	}

	return {
		ariaLabel: v.ariaLabel ? v.ariaLabel : "Controls divider"
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
		ariaLabel: v.ariaLabel ? v.ariaLabel : "Controls divider"
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
		ariaLabel: v.ariaLabel ? v.ariaLabel : "Scrub bar"
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
		ariaLabel: v.ariaLabel ? v.ariaLabel : "Volume control"
	}
}


export type EvaQualityAria = {
	ariaLabel?: string
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
		ariaLabel: v.ariaLabel ? v.ariaLabel : "Overlay play"
	};
}