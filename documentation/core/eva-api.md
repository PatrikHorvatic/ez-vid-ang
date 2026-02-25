# EvaApi

The central state and command hub of the Eva video player. Provided at the component level by `EvaPlayer`, giving each player instance its own isolated service scope — multiple players on the same page each get their own `EvaApi` instance.

All player components and directives communicate through `EvaApi` rather than directly with the native `<video>` element. All public methods that operate on the video element are guarded by `validateVideoAndPlayerBeforeAction()`, which returns early if the player is not yet ready or the video element has not been assigned.

### Reactive State

| Member | Type | Description |
|---|---|---|
| `isBuffering` | `WritableSignal<boolean>` | Whether the video is currently buffering. Updated by event handlers and position-polling. Initial value: `true`. |
| `canPlay` | `WritableSignal<boolean>` | Whether the video has enough data to begin playback (`canplay` event has fired). |
| `isSeeking` | `WritableSignal<boolean>` | Whether a seek operation is currently in progress. |
| `isLive` | `WritableSignal<boolean>` | Whether the current source is a live stream (`duration === Infinity`). Set from `loadedmetadata`. |
| `time` | `WritableSignal<{ current, total, remaining }>` | Current playback time in seconds. Updated on every `timeupdate` event. `total` is `Infinity` for live streams. |
| `currentQualityIndex` | `WritableSignal<number>` | Currently selected quality level index. `-1` represents Auto (ABR). |
| `currentSubtitleCue` | `WritableSignal<string \| null>` | The currently active subtitle cue text. `null` when no cue is active. Updated by `EvaCueChangeDirective`. |

### Subjects

| Member | Type | Description |
|---|---|---|
| `videoStateSubject` | `BehaviorSubject<EvaState>` | Broadcasts the current `EvaState`. Initial value: `EvaState.LOADING`. |
| `videoVolumeSubject` | `BehaviorSubject<number \| null>` | Broadcasts the current volume (`0`–`1`). `null` until the first volume change. |
| `playbackRateSubject` | `BehaviorSubject<number \| null>` | Broadcasts the current playback rate. `null` until the first rate change. |
| `videoTracksSubject` | `BehaviorSubject<EvaTrack[] \| null>` | Broadcasts the current list of available text tracks. |
| `videoSubtitlesSubject` | `BehaviorSubject<EvaTrackInternal \| null>` | Broadcasts the currently selected subtitle track. |
| `videoBufferSubject` | `BehaviorSubject<TimeRanges \| null>` | Broadcasts the video element's `TimeRanges` buffer object on each `progress` event. |
| `videoTimeChangeSubject` | `BehaviorSubject<number>` | Increments on every `timeupdate` event. Subscribed to by components that need to react to time changes with throttling. |
| `qualityLevelsSubject` | `BehaviorSubject<EvaQualityLevel[]>` | Broadcasts available quality levels after the streaming manifest is parsed. |
| `activeChapterSubject` | `BehaviorSubject<EvaChapterMarker \| null>` | Broadcasts the chapter active at the current playback position. Updated by `updateVideoTime()` when `isActiveChapterPresent` is `true`. |
| `chapterMarkerChangesSubject` | `BehaviorSubject<EvaChapterMarker[]>` | Broadcasts the full list of parsed chapter markers when tracks change. |
| `pictureInPictureSubject` | `BehaviorSubject<boolean>` | Broadcasts PiP state. `true` when the player enters PiP, `false` when it leaves. |
| `componentsContainerVisibilityStateSubject` | `BehaviorSubject<boolean>` | Broadcasts controls container visibility state. |
| `controlsSelectorComponentActive` | `BehaviorSubject<boolean>` | Whether a selector dropdown (e.g. quality, track, playback speed) is currently open. |
| `triggerUserInteraction` | `Subject<MouseEvent \| TouchEvent \| PointerEvent>` | Emits on user interaction events. Subscribed to by `EvaControlsContainerComponent` and `EvaScrubBar` for auto-hide. Published to by `EvaUserInteractionEventsDirective`. |
| `playerReadyEvent` | `EventEmitter<EvaApi>` | Emits this instance when the player is fully initialized. Subscribe to defer setup until the player is ready. |

### Playback Commands

| Method | Signature | Description |
|---|---|---|
| `playOrPauseVideo` | `() => void` | Toggles play/pause. Updates `videoStateSubject`. |
| `seekForward` | `(n?: number) => void` | Seeks forward by `n` seconds (default `5`), clamped to total duration. Updates `time` immediately. |
| `seekBack` | `(n?: number) => void` | Seeks backward by `n` seconds (default `5`), clamped to `0`. Updates `time` immediately. |
| `setPlaybackSpeed` | `(speed: number) => void` | Sets the playback rate on the video element. |
| `getPlaybackSpeed` | `() => number` | Returns the current playback rate. Falls back to `1` if not ready. |
| `setVideoVolume` | `(volume: number) => void` | Sets volume, clamped to `[0, 1]`. |
| `getVideoVolume` | `() => number` | Returns current volume. Falls back to `0.75` if not ready. |
| `muteOrUnmuteVideo` | `() => void` | Toggles mute — sets volume to `0` or restores to `0.75`. |

### Picture-in-Picture

| Method | Signature | Description |
|---|---|---|
| `changePictureInPictureStatus` | `() => Promise<void>` | Toggles PiP. Exits if this player is in PiP, enters otherwise. Guards against unsupported browsers and `disablePictureInPicture`. |
| `assignPictureInPictureWindow` | `(e: PictureInPictureEvent) => void` | Called from the `enterpictureinpicture` event listener. Stores the PiP window reference and broadcasts `true` to `pictureInPictureSubject`. |
| `removePictureInPictureWindow` | `(e: PictureInPictureEvent) => void` | Called from the `leavepictureinpicture` event listener. Clears the PiP window reference and broadcasts `false` to `pictureInPictureSubject`. |

### Quality Streaming

| Method | Signature | Description |
|---|---|---|
| `registerQualityFn` | `(fn: (index: number) => void) => void` | Registers the streaming library's quality setter. Called by `EvaHlsDirective` or `EvaDashDirective` after the player is created. |
| `registerQualityLevels` | `(levels: EvaQualityLevel[]) => void` | Broadcasts parsed quality levels to `qualityLevelsSubject`. Called after `MANIFEST_PARSED`. |
| `setQuality` | `(qualityIndex: number) => void` | Switches quality by delegating to the registered quality function. Pass `-1` for Auto (ABR). |

### Subtitles

| Method | Signature | Description |
|---|---|---|
| `onCueChange` | `(track: TextTrack \| null) => void` | Called by `EvaCueChangeDirective` on `cuechange`. Updates `currentSubtitleCue` with the first active VTT cue, or `null`. |
| `subtitlesChanged` | `(label: EvaTrackInternal \| null) => void` | Broadcasts the newly selected subtitle track to `videoSubtitlesSubject`. |

### Chapters

| Method | Signature | Description |
|---|---|---|
| `updateAndPrepareTracks` | `(tracks: EvaTrack[]) => void` | Called from `EvaPlayer.ngOnChanges`. Updates `videoTracksSubject`, then after 300ms parses chapter markers from the video element's text tracks and broadcasts them to `chapterMarkerChangesSubject` and `activeChapterSubject`. |

### Event Listener Callbacks

These methods are called by `EvaMediaEventListenersDirective` from the corresponding native video events. They should not be called directly.

| Method | Native event | Description |
|---|---|---|
| `loadedVideoMetadata` | `loadedmetadata` | Initializes `time` and sets `isLive`. |
| `videoWaiting` | `waiting` | Sets `isBuffering` to `true` if playback has started. |
| `videoCanPlay` | `canplay` | Sets `canPlay` to `true` and clears buffering. |
| `playingVideo` | `playing` | Sets `hasStartedPlaying`, clears buffering, cancels buffering timeout. |
| `videoStalled` | `stalled` | Sets `isBuffering` to `true`. |
| `updateVideoTime` | `timeupdate` | Updates `time`, emits `videoTimeChangeSubject`, runs buffering detection and chapter tracking. |
| `checkBufferStatus` | `progress` | Emits `TimeRanges` to `videoBufferSubject`, checks buffer health. |
| `videoSeeking` | `seeking` | Sets `isSeeking` and `isBuffering` to `true`. |
| `videoSeeked` | `seeked` | Clears `isSeeking`. Resumes playback if `pendingPlayAfterSeek` is set. |
| `playVideo` | `play` | Sets state to `EvaState.PLAYING`. |
| `pauseVideo` | `pause` | Sets state to `EvaState.PAUSED`, clears buffering. |
| `endedVideo` | `ended` | Sets state to `EvaState.ENDED`, clears buffering. |
| `erroredVideo` | `error` | Sets state to `EvaState.ERROR`, clears buffering. |
| `playbackRateVideoChanged` | `ratechange` | Broadcasts new rate to `playbackRateSubject`. |
| `volumeChanged` | `volumechange` | Broadcasts new volume to `videoVolumeSubject`. |

### Utilities

| Method | Signature | Description |
|---|---|---|
| `assignElementToApi` | `(element: HTMLVideoElement) => void` | Assigns the native `<video>` element. Called from `EvaPlayer.ngAfterViewInit`. |
| `onPlayerReady` | `() => void` | Marks the player as ready and emits `playerReadyEvent`. Called from `EvaPlayer.ngAfterViewInit`. |
| `validateVideoAndPlayerBeforeAction` | `() => boolean` | Returns `true` if the player is ready and the video element is assigned. Guards all public methods. |
| `getVideoDuration` | `() => number` | Returns duration in seconds. `NaN` if not ready, `Infinity` for live streams. |
| `getCurrentVideoState` | `() => EvaState` | Returns the current `EvaState` synchronously. |
| `checkIfItIsLiveStram` | `() => boolean` | Returns whether the current source is a live stream. Guarded by player readiness. |
| `destroy` | `() => void` | Completes all subjects, clears timeouts, nulls quality function and PiP window. Called from `EvaPlayer.ngOnDestroy`. |

### Buffering Detection

`EvaApi` uses two complementary strategies to detect buffering:

**Event-based** — reacts to `waiting`, `canplay`, `playing`, `stalled`, and `progress` events fired by the video element.

**Position-polling** — on each `timeupdate`, records the current playback position and schedules a 500ms timeout. If the position has not advanced and `readyState < 3` when the timeout fires, `isBuffering` is set to `true`. The 500ms delay reduces false positives from brief network hiccups. The timeout is cancelled immediately when the video resumes, pauses, or ends.