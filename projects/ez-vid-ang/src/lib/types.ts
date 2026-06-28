import { DEFAULT_STORAGE_KEY } from "./constants";

/**
 * Configuration object for the native `<video>` element.
 * Passed to `EvaVideoConfigurationDirective` via `EvaPlayer`.
 * All properties are optional — only truthy values are applied to the element.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video
 */
export type EvaVideoElementConfiguration = {
	/** Width of the video element in pixels. */
	width?: number;
	/** Height of the video element in pixels. */
	height?: number;
	/** When `true`, the video starts playing as soon as it is ready. */
	autoplay?: boolean;
	/** When `true`, the native browser video controls are shown. */
	controls?: boolean;
	/** Allows specifying which controls to show (e.g. `"nodownload nofullscreen"`). */
	controlsList?: string;
	/** CORS setting for the video element. */
	crossorigin?: 'anonymous' | 'use-credentials';
	/** When `true`, disables picture-in-picture mode. */
	disablePictureInPicture?: boolean;
	/** When `true`, disables remote playback (e.g. Chromecast, AirPlay). */
	disableRemotePlayback?: boolean;
	/** When `true`, the video loops back to the beginning when it ends. */
	loop?: boolean;
	/** When `true`, the video starts muted. */
	muted?: boolean;
	/** When `true`, the video plays inline on mobile rather than entering fullscreen automatically. Maps to `playsInline`. */
	playinline?: boolean;
	/** URL of the poster image shown before playback begins. */
	poster?: string;
	/** Hint to the browser about how much data to preload before playback. */
	preload?: 'none' | 'metadata' | 'auto' | '';
	/**
	 * Initial volume applied to the video element on load.
	 * Validated and clamped to `[0, 1]` via `validateAndPrepareStartingVideoVolume`.
	 */
	startingVolume?: number;
}

/**
 * Configuration for keyboard shortcuts on the Eva video player.
 * All properties are optional — omitted keys fall back to their defaults
 * via `validateAndTransformEvaKeyboardShortcutsConfiguration`.
 */
export type EvaKeyboardShortcutsConfiguration = {
	/** Seconds to seek when a backward key is pressed. @default 10 */
	backwardSeconds?: number,
	/** Primary backward seek key. Matched via `KeyboardEvent.key`. @default "J" */
	backwardsKeyOne?: string,
	/** Primary forward seek key. Matched via `KeyboardEvent.key`. @default "L" */
	forwardKeyOne?: string,
	/** Secondary backward seek key. Matched via `KeyboardEvent.key`. @default "ArrowLeft" */
	backwardsKeyTwo?: string,
	/** Secondary forward seek key. Matched via `KeyboardEvent.key`. @default "ArrowRight" */
	forwardKeyTwo?: string,
	/** Seconds to seek when a forward key is pressed. @default 10 */
	forwardSeconds?: number,
	/** Mute toggle key. Matched via `KeyboardEvent.key`. @default "M" */
	muteKey?: string,
	/** Play/pause toggle key. Matched via `KeyboardEvent.code`. @default "Space" */
	playPause?: string,
	/** Fullscreen toggle key. Matched via `KeyboardEvent.key`. @default "F" */
	fullscreen?: string,
	/** Step forward one frame key. Matched via `KeyboardEvent.key`. @default "." */
	oneFrameForward?: string
	/** Step backward one frame key. Matched via `KeyboardEvent.key`. @default "," */
	oneFrameBackward?: string,

}

export type EvaStorageConfiguration = {
	volume?: boolean,
	playbackSpeed?: boolean,
	cinemaMode?: boolean,
	loop?: boolean
}

/**
 * A selectable option within a settings menu item's sub-menu.
 */
export type EvaSettingsMenuOption = {
	/** Unique identifier for this option, emitted in `EvaSettingsMenuEvent`. */
	id: string;
	/** Display label shown in the sub-menu. */
	label: string;
	/** Whether this option is currently selected. Shown with a checkmark. */
	selected?: boolean | undefined;
}

/**
 * A single item in the `EvaSettingsPanel` main menu.
 *
 * Items with `options` render a navigable sub-menu (like YouTube's settings).
 * Items without `options` emit a click event directly from the main menu.
 */
export type EvaSettingsMenuItem = {
	/** Unique identifier for this item, emitted in `EvaSettingsMenuEvent`. */
	id: string;
	/** Display label shown in the main menu. */
	label: string;
	/** Current value displayed on the right side of the item (e.g. `"1080p"`, `"Normal"`). */
	currentValue?: string | undefined;
	/** Sub-menu options. When present, clicking the item navigates into the sub-menu. */
	options?: EvaSettingsMenuOption[] | undefined;
	/** Whether the item is disabled (visible but not clickable). */
	disabled?: boolean | undefined;
}

/**
 * Data emitted by `EvaSettingsPanel` when a menu option is selected.
 */
export type EvaSettingsMenuEvent = {
	/** The `id` of the parent menu item. */
	itemId: string;
	/** The `id` of the selected option, or `itemId` if the item has no sub-menu. */
	optionId: string;
	/** The `label` of the selected option. */
	label: string;
}


export const validateAndTransformStorageKey = (v: string | undefined): string => {
	if (!v) {
		return DEFAULT_STORAGE_KEY;
	}

	return v;
}

/**
 * Internal representation of a text track option within the dropdown.
 * Derived from `EvaTrack` with a simplified structure for local state management.
 */
export type EvaTrackInternal = {
	/** Language code or `"off"` for the disabled option. */
	id: string;
	/** Display label shown in the dropdown. */
	label: string;
	/** Whether this track is currently active. Only one track can be selected at a time. */
	selected: boolean;
}

/**
 * Represents a single `<source>` element to be rendered inside the `<video>` element.
 * Provide multiple sources for fallback across browsers and formats.
 */
export type EvaVideoSource = {
	/** MIME type of the video source (e.g. `"video/mp4"`, `"video/webm"`, `"application/x-mpegURL"`). */
	type: string;
	/** URL of the video file or stream manifest. */
	src: string;
	/** Optional media query string for responsive source selection. */
	media?: string;
	// Srcset?: string;
	// Sizes?: string;
	// Width?: number;
	// Height?: number;
}

/**
 * Data emitted by `EvaDownload` when the download button is clicked.
 * Contains the current video source URL and the current playback time,
 * giving the consumer everything needed to implement custom download logic.
 */
export type EvaDownloadEvent = {
	/** The current video source URL (`HTMLVideoElement.currentSrc`), or an empty string if not available. */
	currentSrc: string;
	/** The current playback time in seconds at the moment of the click. */
	currentTime: number;
	/** The total video duration in seconds. `Infinity` for live streams. */
	duration: number;
}

/**
 * A single item in the `EvaContextMenu` dropdown.
 */
export type EvaContextMenuItem = {
	/** Display label shown in the menu. */
	label: string;
	/** Unique identifier emitted when the item is clicked. */
	id: string;
	/** Whether the item is a visual separator instead of an actionable item. */
	divider?: boolean;
	/** Whether the item is disabled (visible but not clickable). */
	disabled?: boolean;
}

/**
 * Data emitted by `EvaContextMenu` when a menu item is clicked.
 */
export type EvaContextMenuEvent = {
	/** The `id` of the clicked menu item. */
	itemId: string;
	/** The `label` of the clicked menu item. */
	label: string;
	/** The current video source URL at the time of the click. */
	currentSrc: string;
	/** The current playback time in seconds. */
	currentTime: number;
}

/**
 * Data emitted by `EvaScreenshot` when the screenshot button is clicked.
 * Contains the captured frame as a `Blob` and data URL, plus the capture timestamp.
 * Both are `null` if the capture failed (e.g. cross-origin tainted canvas).
 */
export type EvaScreenshotEvent = {
	/** The captured frame as a `Blob`, or `null` if capture failed. */
	blob: Blob | null;
	/** The captured frame as a base64 data URL, or `null` if capture failed. */
	dataUrl: string | null;
	/** The playback time in seconds at which the frame was captured. */
	currentTime: number;
	/** The natural width of the captured frame in pixels. */
	width: number;
	/** The natural height of the captured frame in pixels. */
	height: number;
}

/**
 * Enum of all possible playback states the Eva player can be in.
 * Broadcast via `EvaApi.videoStateSubject` and consumed by components
 * such as `EvaPlayPause`, `EvaOverlayPlay`, and `EvaTimeDisplay`.
 */
export enum EvaState {
	LOADING = 'loading',
	PLAYING = 'playing',
	PAUSED = 'paused',
	ENDED = 'ended',
	ERROR = 'error'
}

/**
 * Enum of all native `HTMLVideoElement` events that `EvaMediaEventListenersDirective` subscribes to.
 *
 * Based on the full event reference:
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video#events
 */
export enum EvaVideoEvent {
	ABORT = 'abort',
	CAN_PLAY = 'canplay',
	CAN_PLAY_THROUGH = 'canplaythrough',
	COMPLETE = 'complete',
	DURATION_CHANGE = 'durationchange',
	ENTERED_PICTURE_IN_PICTURE = 'enterpictureinpicture',
	LEFT_PICTURE_IN_PICTURE = 'leavepictureinpicture',
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
	DOUBLE_CLICK = 'dblclick',
	VOLUME_CHANGE = 'volumechange',
	WAITING = 'waiting',
	WAITING_FOR_KEY = 'waitingforkey'
}

/** Which time value the `EvaTimeDisplay` component and `EvaTimeDisplayPipe` should render. */
export type EvaTimeProperty = "current" | "total" | "remaining";

/**
 * Format string used by `EvaTimeDisplay`, `EvaTimeDisplayPipe`, and `EvaScrubBar`
 * to format time values in seconds.
 *
 * - `'HH:mm:ss'` — hours, minutes, seconds (e.g. `"01:23:45"`)
 * - `'mm:ss'` — total minutes and seconds (e.g. `"83:45"`)
 * - `'ss'` — total seconds as a plain integer (e.g. `"5025"`)
 */
export type EvaTimeFormating = "HH:mm:ss" | "mm:ss" | "ss";

/**
 * Represents a single chapter marker displayed on `EvaScrubBar`.
 * Can be provided directly via `evaChapters` input or parsed from a VTT text track.
 */
export type EvaChapterMarker = {
	/** Start time of the chapter in seconds. */
	startTime: number;
	/** End time of the chapter in seconds. */
	endTime: number;
	/** Display title of the chapter, shown in the hover tooltip. */
	title: string;
}

/**
 * Type guard that checks whether a string is a valid `EvaVideoEvent` value.
 *
 * @param event - The string to check.
 * @returns `true` if the string is a member of the `EvaVideoEvent` enum.
 */
export const isValidVideoEvent = (event: string): event is EvaVideoEvent => Object.values(EvaVideoEvent).includes(event as EvaVideoEvent);

/**
 * Type guard that checks whether a string is a valid `EvaTrackKind` value.
 *
 * @param kind - The string to check.
 * @returns `true` if the string is one of the five valid HTML track `kind` values.
 */
export const isValidTrackKind = (kind: string): kind is EvaTrackKind => ['subtitles', 'captions', 'descriptions', 'chapters', 'metadata'].includes(kind);

/**
 * The five valid values for the `kind` attribute of an HTML `<track>` element.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track#kind
 */
export type EvaTrackKind =
	| 'subtitles'
	| 'captions'
	| 'descriptions'
	| 'chapters'
	| 'metadata';

/**
 * Base interface shared by all track types.
 * Extended by each specific track interface with their `kind` discriminant.
 */
type EvaBaseTrack = {
	/** URL of the `.vtt` track file. Must be a valid URL. */
	src: string;
	/** Human-readable label displayed in the track selector UI. */
	label?: string;
	/** When `true`, this track is enabled by default on load. */
	default?: boolean;
}

/**
 * Subtitle track. Requires `srclang` (BCP 47 language code).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track#kind
 */
type EvaSubtitleTrack = {
	kind: 'subtitles';
	/** BCP 47 language code (e.g. `"en"`, `"fr"`, `"pt-BR"`). Required for subtitles. */
	srclang: string;
} & EvaBaseTrack

/**
 * Caption track. `srclang` is optional.
 * Captions are similar to subtitles but also describe non-speech audio (e.g. sound effects).
 */
type EvaCaptionTrack = {
	kind: 'captions';
	srclang?: string;
} & EvaBaseTrack

/**
 * Description track. `srclang` is optional.
 * Descriptions provide a text description of the video content for audio-only consumption.
 */
type EvaDescriptionTrack = {
	kind: 'descriptions';
	srclang?: string;
} & EvaBaseTrack

/**
 * Chapter track. `srclang` is optional.
 * Used to define named chapters for navigation. Parsed by `EvaScrubBar` when `evaShowChapters` is enabled.
 */
type EvaChapterTrack = {
	kind: 'chapters';
	srclang?: string;
} & EvaBaseTrack

/**
 * Metadata track. `srclang` is not applicable (`never`).
 * Used for programmatic data embedded in the video timeline, not displayed to users.
 */
type EvaMetadataTrack = {
	kind: 'metadata';
	srclang?: never;
} & EvaBaseTrack

/**
 * Discriminated union of all valid track configurations.
 * The `kind` property narrows the type to the appropriate interface.
 *
 * Used as the input type for `EvaPlayer.evaVideoTracks` and `EvaApi.videoTracksSubject`.
 */
export type EvaTrack =
	| EvaSubtitleTrack
	| EvaCaptionTrack
	| EvaDescriptionTrack
	| EvaChapterTrack
	| EvaMetadataTrack;

/**
 * Represents a single quality/bitrate level available in the stream.
 *
 * Compatible with both HLS and DASH:
 * - HLS → populated from hls.js `levels[]`
 * - DASH → populated from dash.js `getRepresentationsByType('video')`
 *
 * `qualityIndex` is the raw index used by the underlying player library to
 * switch levels. Pass `-1` (or set `isAuto` to `true`) for the "Auto" sentinel.
 */
export type EvaQualityLevel = {
	/**
	 * Raw index used by hls.js / dash.js to switch to this level.
	 * `-1` represents the Auto (ABR) option.
	 */
	qualityIndex: number;
	/** Human-readable label shown in the quality selector UI (e.g. `"1080p"`, `"720p"`, `"Auto"`). */
	label: string;
	/** Video frame width in pixels. `0` when unknown or for the Auto option. */
	width: number;
	/**
	 * Video frame height in pixels. `0` when unknown or for the Auto option.
	 * This is the value most commonly displayed to users (e.g. `720` → `"720p"`).
	 */
	height: number;
	/** Bitrate in bits per second. `0` when unknown or for the Auto option. */
	bitrate: number;
	/** Media type of this level — mirrors the DASH `mediaType` concept. */
	mediaType: 'video' | 'audio';
	/** When `true`, this entry represents the synthetic Auto / ABR option. */
	isAuto?: boolean;
	/** When `true`, this level is currently selected in the quality selector UI. */
	selected?: boolean;
	/** Optional codec string (e.g. `"avc1.640028"`). */
	codec?: string;
	/** Optional frame rate (e.g. `29.97`). */
	frameRate?: number;
}