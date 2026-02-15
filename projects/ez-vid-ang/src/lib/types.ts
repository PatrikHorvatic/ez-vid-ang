export interface EvaVideoElementConfiguration {
	width?: number;
	height?: number;
	autoplay?: boolean;
	controls?: boolean;
	controlsList?: string;
	crossorigin?: 'anonymous' | 'use-credentials';
	disablePictureInPicture?: boolean;
	disableRemotePlayback?: boolean;
	loop?: boolean;
	muted?: boolean;
	playinline?: boolean;
	poster?: string;
	preload?: 'none' | 'metadata' | 'auto' | '';
	startingVolume?: number
}

export interface EvaVideoSource {
	type: string;
	src: string;
	media?: string;
	// srcset?: string;
	// sizes?: string;
	// width?: number;
	// height?: number;
}

export enum EvaState {
	LOADING = 'loading',
	PLAYING = 'playing',
	PAUSED = 'paused',
	ENDED = 'ended',
	ERROR = 'error'
}

/**
 * List of all events based on:
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video#events
 * 
 * All events you can subscribe to.
 */
export enum EvaVideoEvent {
	ABORT = 'abort',
	CAN_PLAY = 'canplay',
	CAN_PLAY_THROUGH = 'canplaythrough',
	COMPLETE = 'complete',
	DURATION_CHANGE = 'durationchange',
	EMPTIED = 'emptied',
	ENCRYPTED = 'encrypted',
	ENDED = 'ended',
	ERROR = 'error',
	LOADED_DATA = 'loadeddata',
	LOADED_METADATA = 'loadedmetadata',
	LOAD_START = 'loadstart',
	PAUSE = 'pause',
	PLAY = 'play',
	PLAYING = 'playing',
	PROGRESS = 'progress',
	RATECHANGE = 'ratechange',
	SEEKED = 'seeked',
	SEEKING = 'seeking',
	STALLED = 'stalled',
	SUSPEND = 'suspend',
	TIME_UPDATE = 'timeupdate',
	VOLUME_CHANGE = 'volumechange',
	WAITING = 'waiting',
	WAITING_FOR_KEY = 'waitingforkey'
}

export type EvaTimeProperty = "current" | "total" | "remaining";
export type EvaTimeFormating = "HH:mm:ss" | "mm:ss" | "ss";

export const isValidVideoEvent = (event: string): event is EvaVideoEvent => {
	return Object.values(EvaVideoEvent).includes(event as EvaVideoEvent);
};

export const isValidTrackKind = (kind: string): kind is EvaTrackKind => {
	return ['subtitles', 'captions', 'descriptions', 'chapters', 'metadata'].includes(kind);
};


/**
 * According to:
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track#kind
 */
export type EvaTrackKind =
	| 'subtitles'
	| 'captions'
	| 'descriptions'
	| 'chapters'
	| 'metadata';

/**
 * Base track interface
 */
interface EvaBaseTrack {
	/** Address of the track (.vtt file). Must be a valid URL. */
	src: string;
	/** User-readable title of the text track */
	label?: string;
	/** Indicates that the track should be enabled by default */
	default?: boolean;
}

/**
 * Subtitle track - requires srclang
 */
interface EvaSubtitleTrack extends EvaBaseTrack {
	kind: 'subtitles';
	/** Language of the track (BCP 47). Required for subtitles. */
	srclang: string;
}

/**
 * Caption track - optional srclang
 */
interface EvaCaptionTrack extends EvaBaseTrack {
	kind: 'captions';
	srclang?: string;
}

/**
 * Description track - optional srclang
 */
interface EvaDescriptionTrack extends EvaBaseTrack {
	kind: 'descriptions';
	srclang?: string;
}

/**
 * Chapter track - optional srclang
 */
interface EvaChapterTrack extends EvaBaseTrack {
	kind: 'chapters';
	srclang?: string;
}

/**
 * Metadata track - no srclang needed
 */
interface EvaMetadataTrack extends EvaBaseTrack {
	kind: 'metadata';
	srclang?: never;
}

/**
 * Union type representing any valid track configuration
 */
export type EvaTrack =
	| EvaSubtitleTrack
	| EvaCaptionTrack
	| EvaDescriptionTrack
	| EvaChapterTrack
	| EvaMetadataTrack;

