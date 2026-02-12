export interface EvaVideoElementConfiguration {
	width?: number,
	height?: number,
	autoplay?: boolean,
	controls?: boolean,
	controlsList?: string,
	crossorigin?: "anonymous" | "use-credeintals",
	disablePictureInPicture?: boolean,
	disableRemotePlayback?: boolean,
	loop?: boolean,
	muted?: boolean,
	playinline?: boolean,
	poster?: string,
	preload?: "none" | "metadata" | "auto"
}

export interface EvaVideoSource {
	type: string,
	src: string,
	media?: string
	// srcset: string,
	// sizes: string,
	// width: string,
	// height: string
}

export enum EvaState {
	LOADING = 'loading',
	PLAYING = 'playing',
	PAUSED = 'paused',
	ENDED = 'ended'
}

/**List of all events based on:
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video#events
 * 
 * There are all the events you can subscribe to.
 * */
export enum EvaVideoEvent {
	CAN_PLAY = 'canplay',
	CAN_PLAY_THROUGH = 'canplaythrough',
	COMPLETE = 'complete',
	DURATION_CHANGE = 'durationchange',
	EMPTIED = 'emptied',
	ENDED = 'ended',
	ERROR = 'error',
	LOADED_DATA = 'loadeddata',
	LOADED_METADATA = 'loadedmetadata',
	LOAD_STARD = 'loadstart',
	PAUSE = 'pause',
	PLAY = 'play',
	PLAYING = 'playing',
	PROGRESS = 'progress',
	RATECHANGE = 'ratechange',
	SEEKED = 'seeked',
	SEEKING = 'seeking',
	STALLER = 'stalled',
	SUSPEND = 'suspend',
	TIME_UPDATE = 'timeupdate',
	VOLUME_CHANGE = 'columechange',
	WAITING = 'waiting'
}

/**According to:
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track#attributes
 */
export interface EvaVideoTrack {

	/**This attribute indicates that the track should be enabled unless the user's preferences indicate that another track is more appropriate. 
	 * 
	 * This may only be used on one track element per media element */
	default: boolean,

	/**How the text track is meant to be used. 
	 * 
	 * If omitted the default kind is subtitles. 
	 * 
	 * If the attribute contains an invalid value, it will use metadata. */
	kind: EvaVideoTrackKinds,

	/**A user-readable title of the text track which is used by the browser when listing available text tracks. */
	label: string,

	/**
	 * Address of the track (.vtt file). Must be a valid URL. 
	 * 
	 * This attribute must be specified and its URL value must have the same origin as the document unless the video parent element of the track element has a crossorigin attribute.
	  */
	src: string,

	/**Language of the track text data. 
	 *
	 * It must be a valid BCP 47 language tag. 
	 * 
	 * If the kind attribute is set to subtitles, then srclang must be defined. */
	srclang: string
}

/**According to:
 * 
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track#kind
 */
export type EvaVideoTrackKinds = "subtitles" | "captions" | "descriptions" | "chapters" | "metadata"