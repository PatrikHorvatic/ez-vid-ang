## EvaPlayer

The `EvaPlayer` component is the top-level host of the Eva video player library. It owns its own scoped `EvaApi` and `EvaFullscreenAPI` instances, enabling multiple independent players on the same page without state conflicts.

---

### Selector

```html
<eva-player />
```

---

### Usage

```html
<eva-player
  id="main-player"
  [evaVideoSources]="sources"
  [evaVideoConfiguration]="{ autoplay: true, muted: true }"
  [evaVideoTracks]="tracks"
/>
```

---

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `string` | ✅ Yes | — | Unique identifier for this player instance. Required to distinguish multiple players on the same page. |
| `evaVideoSources` | `EvaVideoSource[]` | ✅ Yes | — | List of video sources to load into the player. |
| `evaVideoConfiguration` | `EvaVideoElementConfiguration` | No | `{}` | Configuration object applied to the native `<video>` element. |
| `evaVideoTracks` | `EvaTrack[]` | No | `[]` | List of subtitle/text tracks to attach to the video element. Runtime changes are automatically forwarded to child components. |
| `evaNotSupportedText` | `string` | No | `"I'm sorry; your browser doesn't support HTML video."` | Fallback text displayed inside the `<video>` element for browsers that do not support HTML5 video. |

---

### Providers

`EvaPlayer` provides the following services scoped to its component subtree. All child components and directives injecting these services will receive the instance belonging to their nearest parent `EvaPlayer`.

| Service | Description |
|---|---|
| `EvaApi` | Core player API. Manages the native video element, track subjects, and player readiness state. |
| `EvaFullscreenAPI` | Manages fullscreen state and transitions for this player instance. |

---

### Streaming Directives

`EvaPlayer` supports optional HLS and DASH streaming via directives applied to its internal `<video>` element. If neither is present, the player falls back to native browser source handling.

| Directive | Token | Description |
|---|---|---|
| `evaHls` | `EvaHlsDirective` | Enables HLS streaming. |
| `evaDash` | `EvaDashDirective` | Enables DASH streaming. |

---

### Multiple Players

Because `EvaPlayer` provides `EvaApi` and `EvaFullscreenAPI` at the component level, each player instance is fully isolated. You can safely render multiple players on the same page:

```html
<eva-player id="player-1" [evaVideoSources]="sourcesA" />
<eva-player id="player-2" [evaVideoSources]="sourcesB" />
```

---

## Types

### `EvaVideoSource`

Represents a single `<source>` element rendered inside the `<video>` element. Provide multiple sources for fallback across browsers and formats.

```ts
interface EvaVideoSource {
  /** MIME type of the video source (e.g. "video/mp4", "application/x-mpegURL"). */
  type: string;
  /** URL of the video file or stream manifest. */
  src: string;
  /** Optional media query string for responsive source selection. */
  media?: string;
}
```

---

### `EvaVideoElementConfiguration`

Configuration applied directly to the native `<video>` element. All properties are optional — only truthy values are applied.

```ts
interface EvaVideoElementConfiguration {
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
  /** Initial volume clamped to [0, 1]. */
  startingVolume?: number;
}
```

---

### `EvaTrack`

Discriminated union of all valid track configurations. The `kind` property narrows the type to the correct interface. Used as the input type for `EvaPlayer.evaVideoTracks`.

```ts
type EvaTrack =
  | EvaSubtitleTrack      // kind: 'subtitles'    — requires srclang
  | EvaCaptionTrack       // kind: 'captions'     — srclang optional
  | EvaDescriptionTrack   // kind: 'descriptions' — srclang optional
  | EvaChapterTrack       // kind: 'chapters'     — srclang optional
  | EvaMetadataTrack;     // kind: 'metadata'     — srclang not applicable
```

All track types share the following base properties:

| Property | Type | Required | Description |
|---|---|---|---|
| `src` | `string` | ✅ Yes | URL of the `.vtt` track file. |
| `kind` | `EvaTrackKind` | ✅ Yes | Discriminant — one of `'subtitles'`, `'captions'`, `'descriptions'`, `'chapters'`, `'metadata'`. |
| `srclang` | `string` | Varies | BCP 47 language code (e.g. `"en"`, `"pt-BR"`). Required for `subtitles`, optional for others, not applicable for `metadata`. |
| `label` | `string` | No | Human-readable label displayed in the track selector UI. |
| `default` | `boolean` | No | When `true`, this track is enabled by default on load. |

---

### `EvaState`

Enum of all possible playback states broadcast via `EvaApi.videoStateSubject`.

```ts
enum EvaState {
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED  = 'paused',
  ENDED   = 'ended',
  ERROR   = 'error'
}
```

---

### `EvaVideoEvent`

Enum of all native `HTMLVideoElement` events the player subscribes to internally.

```ts
enum EvaVideoEvent {
  ABORT             = 'abort',
  CAN_PLAY          = 'canplay',
  CAN_PLAY_THROUGH  = 'canplaythrough',
  DURATION_CHANGE   = 'durationchange',
  EMPTIED           = 'emptied',
  ENCRYPTED         = 'encrypted',
  ENDED             = 'ended',
  ERROR             = 'error',
  LOADED_DATA       = 'loadeddata',
  LOADED_METADATA   = 'loadedmetadata',
  LOAD_START        = 'loadstart',
  PAUSE             = 'pause',
  PLAY              = 'play',
  PLAYING           = 'playing',
  PROGRESS          = 'progress',
  RATECHANGE        = 'ratechange',
  SEEKED            = 'seeked',
  SEEKING           = 'seeking',
  STALLED           = 'stalled',
  SUSPEND           = 'suspend',
  TIME_UPDATE       = 'timeupdate',
  VOLUME_CHANGE     = 'volumechange',
  WAITING           = 'waiting',
  WAITING_FOR_KEY   = 'waitingforkey'
}
```

---

### `EvaTimeProperty`

Determines which time value `EvaTimeDisplay` and `EvaTimeDisplayPipe` render.

```ts
type EvaTimeProperty = "current" | "total" | "remaining";
```

---

### `EvaTimeFormating`

Format string used by `EvaTimeDisplay`, `EvaTimeDisplayPipe`, and `EvaScrubBar`.

```ts
type EvaTimeFormating = "HH:mm:ss" | "mm:ss" | "ss";
```

| Value | Example output |
|---|---|
| `"HH:mm:ss"` | `"01:23:45"` |
| `"mm:ss"` | `"83:45"` |
| `"ss"` | `"5025"` |

---

### `EvaChapterMarker`

Represents a single chapter marker displayed on `EvaScrubBar`. Can be provided directly via `evaChapters` or parsed from a VTT chapter track.

```ts
type EvaChapterMarker = {
  startTime: number;  // seconds
  endTime: number;    // seconds
  title: string;      // shown in hover tooltip
}
```

---

### `EvaQualityLevel`

Represents a single quality/bitrate level available in the stream. Compatible with both HLS (`hls.js levels[]`) and DASH (`getBitrateInfoListFor('video')`). Pass `qualityIndex: -1` for the Auto (ABR) sentinel.

```ts
interface EvaQualityLevel {
  qualityIndex: number;          // -1 = Auto (ABR)
  label: string;                 // e.g. "1080p", "Auto"
  width: number;                 // 0 when unknown
  height: number;                // 0 when unknown
  bitrate: number;               // bits per second; 0 when unknown
  mediaType: 'video' | 'audio';
  isAuto?: boolean;
  selected?: boolean;
  codec?: string;                // e.g. "avc1.640028"
  frameRate?: number;            // e.g. 29.97
}
```

---

## Aria Types

All aria input types follow the same pattern: an optional input type (e.g. `EvaFullscreenAria`) whose properties are all optional, and a transformed counterpart with all properties required (e.g. `EvaFullscreenAriaTransformed`). Default values are applied automatically when a property is omitted.

---

### `EvaFullscreenAria`

| Property | Default |
|---|---|
| `enterFullscreen` | `"Enter fullscreen"` |
| `exitFullscreen` | `"Exit fullscreen"` |

---

### `EvaMuteAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"mute"` |
| `ariaValueTextMuted` | `"Muted"` |
| `ariaValueTextUnmuted` | `"Unmuted"` |

---

### `EvaPlayPauseAria`

| Property | Default |
|---|---|
| `ariaLabel.play` | `"play"` |
| `ariaLabel.pause` | `"pause"` |
| `ariaValueText.playing` | `"playing"` |
| `ariaValueText.loading` | `"loading"` |
| `ariaValueText.paused` | `"paused"` |
| `ariaValueText.ended` | `"ended"` |
| `ariaValueText.errored` | `"errored"` |

---

### `EvaPlaybackSpeedAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Playback speed"` |

---

### `EvaTimeDisplayAria`

The active property depends on the `EvaTimeProperty` set on the component.

| Property | Used when `evaTimeProperty` is | Default |
|---|---|---|
| `ariaLabelCurrent` | `"current"` | `"Current time display"` |
| `ariaLabelTotal` | `"total"` | `"Duration display"` |
| `ariaLabelRemaining` | `"remaining"` | `"Remaining time display"` |

---

### `EvaScrubBarAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Scrub bar"` |

---

### `EvaVolumeAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Volume control"` |

---

### `EvaOverlayPlayAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Overlay play"` |