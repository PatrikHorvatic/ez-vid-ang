## EvaMediaEventListenersDirective

A directive that bridges native `HTMLVideoElement` media events to the `EvaApi` layer using RxJS `fromEvent` observables. Applied as an attribute on the `<video>` element inside `EvaPlayer`.

---

### Selector

```html
<video evaMediaEventListeners />
```

---

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



## EvaUserInteractionEventsDirective

A directive that listens for user interaction events on the native `HTMLVideoElement` and forwards them to `EvaApi.triggerUserInteraction`. Other components such as `eva-controls-container` subscribe to this subject to drive auto-hide behaviour.

If the player is not yet ready on init, listener setup is automatically deferred until `EvaApi.playerReadyEvent` fires.

---

### Selector

```html
<eva-controls-container evaUserInteractionEvents />
```

---

### Listened Events

All three streams are merged into a single observable and torn down automatically when the directive is destroyed.

| Event | Target | Notes |
|---|---|---|
| `mousemove` | `HTMLVideoElement` | Throttled to one emission per 100ms. |
| `touchstart` | `HTMLVideoElement` | Fires on any touch interaction. |
| `click` | `HTMLVideoElement` | Fires on any pointer click. |




## EvaVideoConfigurationDirective

A directive that applies an `EvaVideoElementConfiguration` object to a native `<video>` element's DOM properties. Configuration is applied after the view initializes, and re-applied on runtime input changes.

Only properties that are explicitly set in the config object are applied — unset properties are left at their native defaults. The exception is `startingVolume`, which is always validated and clamped to `[0, 1]` before assignment.

---

### Selector

```html
<video evaVideoConfiguration />
```

---

### Inputs

| Input | Type | Required | Description |
|---|---|---|---|
| `evaVideoConfig` | `EvaVideoElementConfiguration` | ✅ Yes | Configuration object applied to the native `<video>` element. See supported properties below. |

---

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

---

### Usage

```html
<video
  evaVideoConfiguration
  [evaVideoConfig]="{ autoplay: true, muted: true, startingVolume: 0.8, poster: '/thumb.jpg' }"
/>
```