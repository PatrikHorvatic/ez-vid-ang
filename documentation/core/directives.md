## EvaMediaEventListenersDirective
A directive that bridges native `HTMLVideoElement` media events to the `EvaApi` layer using RxJS `fromEvent` observables. Applied as an attribute on the `<video>` element inside `EvaPlayer`.
### Selector
```html
<video evaMediaEventListeners />
```
### Event Map

Events with an active `EvaApi` side effect:

| Event | `EvaApi` call | Description |
|---|---|---|
| `canplay` | `videoCanPlay()` | Video is ready to begin playback. |
| `ended` | `endedVideo()` | Playback has reached the end. |
| `error` | `erroredVideo()` | A playback error has occurred. |
| `loadedmetadata` | `loadedVideoMetadata(event)` | Duration, dimensions, and track info are available. |
| `pause` | `pauseVideo()` | Video has been paused. |
| `play` | `playVideo()` | Play has been requested (before frames render). |
| `playing` | `playingVideo()` | Video is actively rendering frames. |
| `progress` | `checkBufferStatus()` | Browser is downloading media data. |
| `ratechange` | `playbackRateVideoChanged(event)` | Playback speed has changed. |
| `seeked` | `videoSeeked()` | A seek operation has completed. |
| `seeking` | `videoSeeking()` | A seek operation has begun. |
| `stalled` | `videoStalled()` | Browser has stalled while fetching data. |
| `timeupdate` | `updateVideoTime()` | Current playback position has changed. |
| `volumechange` | `volumeChanged(event)` | Volume or mute state has changed. |
| `waiting` | `videoWaiting()` | Video is waiting for data before continuing. |

The following events are subscribed but reserved for future implementation: `abort`, `canplaythrough`, `complete`, `durationchange`, `emptied`, `encrypted`, `loadeddata`, `loadstart`, `suspend`, `waitingforkey`.

---

## EvaUserInteractionEventsDirective

A directive that listens for user interaction events on the native `HTMLVideoElement` and forwards them to `EvaApi.triggerUserInteraction`. Other components such as `eva-controls-container` subscribe to this subject to drive auto-hide behaviour.

Also handles **double-click to toggle fullscreen** (desktop) and **double-tap to seek** (mobile).

If the player is not yet ready on init, listener setup is automatically deferred until `EvaApi.playerReadyEvent` fires.
### Selector

```html
<eva-controls-container evaUserInteractionEvents />
```

### Usage

```html
<!-- Required for auto-hide to work — must be placed on eva-controls-container -->
<eva-controls-container evaUserInteractionEvents [evaAutohide]="true">
  <eva-play-pause />
  <eva-fullscreen />
</eva-controls-container>

<!-- Auto-hide with scrub bar synced to the same interaction events -->
<eva-player id="my-player" [evaVideoSources]="sources">
  <eva-scrub-bar [hideWithControlsContainer]="true">
    <eva-scrub-bar-buffering-time />
    <eva-scrub-bar-current-time />
  </eva-scrub-bar>

  <eva-controls-container evaUserInteractionEvents [evaAutohide]="true" [evaAutohideTime]="4000">
    <eva-play-pause />
    <eva-mute />
    <eva-volume />
    <eva-fullscreen />
  </eva-controls-container>
</eva-player>
```

### Listened Events

All streams are merged into observables and torn down automatically when the directive is destroyed.

| Event | Target | Notes |
|---|---|---|
| `mousemove` | `HTMLVideoElement` | Throttled to one emission per 100ms. Forwarded to `EvaApi.triggerUserInteraction`. |
| `touchstart` | `HTMLVideoElement` | Fires on any touch interaction. Forwarded to `EvaApi.triggerUserInteraction`. |
| `click` | `HTMLVideoElement` | Fires on any pointer click. Forwarded to `EvaApi.triggerUserInteraction`. |
| `dblclick` | `HTMLVideoElement` | Toggles fullscreen via `EvaFullscreenAPI`. |


---

## EvaVideoConfigurationDirective

A directive that applies an `EvaVideoElementConfiguration` object to a native `<video>` element's DOM properties. Configuration is applied after the view initializes, and re-applied on runtime input changes.

Only properties that are explicitly set in the config object are applied — unset properties are left at their native defaults. The exception is `startingVolume`, which is always validated and clamped to `[0, 1]` before assignment.

### Selector

```html
<video evaVideoConfiguration />
```
### Inputs

| Input | Type | Required | Description |
|---|---|---|---|
| `evaVideoConfig` | `EvaVideoElementConfiguration` | ✅ Yes | Configuration object applied to the native `<video>` element. See supported properties below. |

### Supported Configuration Properties

All properties are optional. Only truthy values are applied to the element.

| Property | Type | Description |
|---|---|---|
| `width` | `number` | Width of the video element in pixels. |
| `height` | `number` | Height of the video element in pixels. |
| `autoplay` | `boolean` | Start playback automatically when ready. |
| `controls` | `boolean` | Show native browser video controls. |
| `crossorigin` | `'anonymous' \| 'use-credentials'` | CORS setting for the video element. |
| `disablePictureInPicture` | `boolean` | Prevent picture-in-picture mode. |
| `disableRemotePlayback` | `boolean` | Prevent remote playback (e.g. Chromecast, AirPlay). |
| `loop` | `boolean` | Loop playback when the video ends. |
| `muted` | `boolean` | Start the video muted. |
| `playinline` | `boolean` | Play inline on mobile instead of entering fullscreen. Maps to `playsInline`. |
| `poster` | `string` | URL of the poster image shown before playback begins. |
| `preload` | `'none' \| 'metadata' \| 'auto' \| ''` | Preload hint for the browser. |
| `startingVolume` | `number` | Initial volume on load. Validated and clamped to `[0, 1]`. |

### Usage

```html
<video
  evaVideoConfiguration
  [evaVideoConfig]="{ autoplay: true, muted: true, startingVolume: 0.8, poster: '/thumb.jpg' }"
/>
```

---

## EvaCueChangeDirective

Attaches a native `cuechange` listener to a `<track>` element and forwards cue changes to `EvaApi.onCueChange()`. This is what drives the subtitle display — when the active VTT cue changes, `currentSubtitleCue` on `EvaApi` is updated and `EvaSubtitleDisplay` re-renders.

The listener is managed reactively via Angular's `effect()`. Toggling `evaCueChangeActive` at runtime cleanly attaches or detaches the handler with no `ngOnChanges` required.
### Selector

```
track[evaCueChange]
```

### Usage

```html

```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaCueChangeActive` | `boolean` | No | `false` | When `true`, attaches a `cuechange` listener. When `false`, removes it and clears the active cue. |

### EvaApi Integration

| Called method | When |
|---|---|
| `EvaApi.onCueChange(track)` | On every `cuechange` event while `evaCueChangeActive` is `true`. |
| `EvaApi.onCueChange(null)` | Implicitly, when `evaCueChangeActive` switches to `false` via the effect cleanup. |

---

## EvaKeyboardShortcuts

A directive that enables configurable keyboard shortcuts on the player. Listens on the `document` for `keydown` events and delegates to `EvaApi` and `EvaFullscreenAPI` methods. The listener is added and removed dynamically via an `effect()` based on the `evaKeyboardShortcutsEnabled` input.

Shortcuts are suppressed when focus is inside an `<input>`, `<textarea>`, `<select>`, `contenteditable` element, or any element with an interactive ARIA role (`listbox`, `combobox`, `menu`, `menuitem`, `slider`, `spinbutton`, `textbox`, `searchbox`, `gridcell`).

In multi-player setups, only the last-interacted player responds to shortcuts. When focus is inside a specific `eva-player`, only that player handles the event.

Applied as a template directive on the `<video>` element inside `EvaPlayer` — consumers configure it via inputs on `<eva-player>` directly.

### Selector

```html
<eva-player [evaKeyboardShortcutsEnabled]="true" />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaKeyboardShortcutsEnabled` | `boolean` | ✅ Yes | — | When `true`, attaches a `keydown` listener on the document. When `false`, removes it. |
| `evaKeyboardShortcutsConfiguration` | `EvaKeyboardShortcutsConfiguration` | ✅ Yes | — | Configures which keys trigger player actions. See [`EvaKeyboardShortcutsConfiguration`](player.md#evakeyboardshortcutsconfiguration) for defaults and available properties. |

### Keyboard Actions

| Action | Default Key | `EvaApi` / Service call |
|---|---|---|
| Seek backward 10s (primary) | `J` | `EvaApi.seekBack(10)` |
| Seek forward 10s (primary) | `L` | `EvaApi.seekForward(10)` |
| Seek backward 10s (secondary) | `ArrowLeft` | `EvaApi.seekBack(10)` |
| Seek forward 10s (secondary) | `ArrowRight` | `EvaApi.seekForward(10)` |
| Toggle mute | `M` | `EvaApi.muteOrUnmuteVideo()` |
| Toggle play/pause | `Space` | `EvaApi.playOrPauseVideo()` |
| Toggle fullscreen | `F` | `EvaFullscreenAPI.toggleFullscreen()` |
| Step backward one frame | `,` | `EvaApi.seekBack(1/30)` |
| Step forward one frame | `.` | `EvaApi.seekForward(1/30)` |
| Jump to 0%–90% of duration | `0`–`9` | `EvaApi.jumpToVideoPercentage(key)` |

### Usage

```html
<!-- Enable with default key bindings -->
<eva-player
  id="player"
  [evaVideoSources]="sources"
  [evaKeyboardShortcutsEnabled]="true"
/>

<!-- Enable with custom key bindings -->
<eva-player
  id="player"
  [evaVideoSources]="sources"
  [evaKeyboardShortcutsEnabled]="true"
  [evaKeyboardShortcutsConfiguration]="{ backwardsKey: 'ArrowLeft', forwardKey: 'ArrowRight' }"
/>
```

### Notes

- Key matching uses `KeyboardEvent.key` (case-insensitive) for all shortcuts except `playPause`, which uses `KeyboardEvent.code` to reliably detect the Space bar.
- All configured key values are normalized to uppercase once in `validateAndTransformEvaKeyboardShortcutsConfiguration`, so consumers can pass keys in any casing.
- The listener is attached to `document`, not the host element, so shortcuts work regardless of which element has focus.
- **Multi-player scoping:** when focus is inside a specific `eva-player`, only that player handles the event. When focus is outside all players (e.g. on `document.body`), the last-interacted player responds. This prevents multiple players from reacting to the same keystroke.
- Cleanup is handled via `DestroyRef` — the listener is always removed when the directive is destroyed.