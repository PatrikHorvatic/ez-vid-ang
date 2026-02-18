export type EvaFullscreenAria = {
	exitFullscreen?: string,
	enterFullscreen?: string,
}

export type EvaFullscreenAriaTransformed = Required<EvaFullscreenAria>;

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


export type EvaMuteAria = {
	/**Default value is mute*/
	ariaLabel?: string,
	/**Default is muted/unmuted */
	ariaValueTextMuted?: string
	ariaValueTextUnmuted?: string
}
export type EvaMuteAriaTransformed = Required<EvaMuteAria>;

export function transformEvaMuteAria(v: EvaMuteAria | undefined): EvaMuteAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "",
			ariaValueTextMuted: "",
			ariaValueTextUnmuted: "",
		}
	}

	return {
		ariaLabel: "",
		ariaValueTextMuted: "",
		ariaValueTextUnmuted: "",
	}
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

export type EvaPlaybackSpeedAria = {
	ariaLabel?: string,
}
export type EvaPlaybackSpeedAriaTransformed = Required<EvaPlaybackSpeedAria>;

export function transformEvaPlaybackSpeedAria(v: EvaPlaybackSpeedAria | undefined): EvaPlaybackSpeedAriaTransformed {
	if (!v) {
		return {
			ariaLabel: "playback speed"
		}
	}

	return {
		ariaLabel: v.ariaLabel ? v.ariaLabel : "playback speed"
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

export type EvaVolumeAria = {
	ariaLabel?: string
}