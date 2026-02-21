# EzVidAng (Easy Video Angular)

Highly configurable and easy-to-use Angular component library for video playback and streaming.

## Why to use it?
🚦 **Signal based components** - Granular and optimized render updates<br/>
⚡ **Zoneless** - Built for zoneless Angular applications by default<br/>
🚀 **High performance** – Powered by RxJS; change detection runs only when needed (no zone pollution)<br/>
🎨 **Highly customizable** – Styling variables, custom icons, and fonts. Bring your own assets<br/>
♿ **ARIA compliant** – All components follow ARIA standards and support custom inputs<br/>
🌍 **Multilanguage support** – Configurable text inputs for full localization<br/>
▶️ **Inspired by modern players** – Familiar UX similar to popular platforms<br/>
📱 **Responsive design** - Works across all screen sizes and devices<br/>


## Version compatibility

EzVidAng follows the _[actively supported versions](https://angular.dev/reference/releases#actively-supported-versions)_ defined by the Angular team. When an Angular version reaches end of support, the corresponding EzVidAng version will no longer be maintained.

| EzVidAng    | Angular    | Node.js                           |
| ----------- | ---------- | --------------------------------- |
| ^19.0.0     | ^19.0.0    | [According to Angular docs](https://angular.dev/reference/releases#actively-supported-versions)    |
| ^20.0.0     | ^20.0.0    | [According to Angular docs](https://angular.dev/reference/releases#actively-supported-versions)    |
| ^21.0.0     | ^21.0.0    | [According to Angular docs](https://angular.dev/reference/releases#actively-supported-versions)    |


## Installing and preparation

Install the package:
```
npm i @ez-vid-ang/ez-vid-ang
```
Add the required styles to your angular.json:
```
{
  "projects": {
    "your_project": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "node_modules/ez-vid-ang/assets/eva-required-import.scss",
              "node_modules/ez-vid-ang/assets/eva-icons-and-fonts.scss"
            ]
          }
        }
      }
    }
  }
}
```
> [!NOTE]
> *eva-icons-and-fonts.scss* is optional if you provide custom icons and fonts for all components. It includes a prepared *.woff* file and utility classes for default icon usage.
<br/>

Import the needed modules into your standalone component or NgModule:
```
import { Component } from '@angular/core';
import { EvaBufferingModule, EvaControlsModule, EvaCoreModule, EvaStreamingModule } from 'ez-vid-ang';

@Component({
  selector: 'lt-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  imports: [
    EvaCoreModule,
    EvaControlsModule,
    EvaBufferingModule,
    EvaStreamingModule
  ]
})
export class HomePage {}

```

## Modules

Library has four logically grouped modules:
- **EvaCoreModule** – Main player component, directives, and providers
- **EvaControlsModule** – Video control components and pipes
- **EvaBufferingModule** – Loading and buffering indicators
- **EvaStreamingModule** – Directives for live streaming support


## EvaCoreModule
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

--------------------------------------------

## SCSS variables

| Variable | Default Value | Description |
|----------|--------------|------------|
| --eva-control-element-height | 50px | Height of control elements (buttons, selectors, etc.) |
| --eva-transition-duration | 0.2s | Default transition duration for animated elements |
| --eva-font-family | Arial | Global font family used in the player |
| --eva-icon-color | white | Default icon color |
| --eva-controls-container-background-color | rgb(0 0 0) | Background color of the controls container |
| --eva-controls-container-controls-spacing | 4px | Spacing between control elements |
| --eva-scrub-bar-heights | 5px | Height of the scrub/progress bar |
| --eva-scrub-bar-background | rgb(54, 54, 54) | Background color of the scrub bar |
| --eva-scrub-bar-buffering-background | gray | Background color of the buffered portion |
| --eva-scrub-bar-current-time-background | green | Background color of the played portion |
| --eva-scrub-bar-chapter-marker-color | rgba(255, 255, 255, 0.5) | Color of chapter markers |
| --eva-scrub-bar-chapter-marker-width | 3px | Width of chapter markers |
| --eva-scrub-bar-chapter-hover-background-color | rgba(0, 0, 0, 0.85) | Background color of chapter hover area |
| --eva-scrub-bar-chapter-hover-text-color | white | Text color of chapter hover label |
| --eva-scrub-bar-chapter-hover-font-size | 14px | Font size of chapter hover label |
| --eva-scrub-bar-chapter-hover-tooltip-background-color | rgba(0, 0, 0, 0.75) | Background color of chapter tooltip |
| --eva-scrub-bar-chapter-hover-tooltip-text-color | white | Text color of chapter tooltip |
| --eva-scrub-bar-chapter-hover-tooltip-font-size | 14px | Font size of chapter tooltip |
| --eva-time-display-text-color | white | Color of the current time / duration text |
| --eva-buffering-background-color | rgba(0, 0, 0, 0.7) | Overlay background color while buffering |
| --eva-buffering-default-spinner-size | 56px | Default size of buffering spinner |
| --eva-buffering-spinner-animation-speed | 0.8s | Animation speed of buffering spinner |
| --eva-overlay-play-background-color | rgba(0, 0, 0, 0.7) | Background color of overlay play button |
| --eva-playback-speed-label-font-size | 14px | Font size of playback speed label |
| --eva-playback-speed-label-color | rgba(255, 255, 255, 0.95) | Color of playback speed label |
| --eva-playback-speed-dropdown-arrow-size | 20px | Size of playback speed dropdown arrow |
| --eva-playback-speed-dropdown-arrow-color | rgba(255, 255, 255, 0.6) | Color of playback speed dropdown arrow |
| --eva-playback-speed-hover-background | rgba(255, 255, 255, 0.1) | Hover background for playback speed selector |
| --eva-playback-speed-opened-background | rgba(255, 255, 255, 0.15) | Background when playback speed selector is opened |
| --eva-playback-speed-dropdown-content-background | rgba(28, 28, 30, 0.95) | Background of playback speed dropdown panel |
| --eva-playback-speed-dropdown-content-box-shadow | 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) | Box shadow of playback speed dropdown |
| --eva-playback-speed-dropdown-content-header-font-size | 14px | Font size of dropdown header |
| --eva-playback-speed-dropdown-content-header-font-color | rgba(255, 255, 255, 0.5) | Color of dropdown header text |
| --eva-playback-speed-dropdown-content-header-bottom-border | 1px solid rgba(255, 255, 255, 0.1) | Bottom border of dropdown header |
| --eva-playback-speed-dropdown-content-speed-option-bacground-hover | rgba(255, 255, 255, 0.1) | Hover background for speed options |
| --eva-playback-speed-dropdown-content-speed-option-icon-active | rgba(59, 130, 246, 0.3) | Background of active speed option icon |
| --eva-playback-speed-dropdown-content-speed-option-font-size | 14px | Font size of speed options |
| --eva-playback-speed-dropdown-content-speed-option-font-color | rgba(255, 255, 255, 0.95) | Text color of speed options |
| --eva-playback-speed-dropdown-content-speed-option-checkmark-size | 16px | Size of checkmark icon |
| --eva-playback-speed-dropdown-content-speed-option-checkmark-color | rgb(59, 130, 246) | Color of checkmark icon |
| --eva-track-selector-label-font-size | 14px | Font size of track selector label |
| --eva-track-selector-label-color | rgba(255, 255, 255, 0.95) | Color of track selector label |
| --eva-track-selector-dropdown-arrow-size | 20px | Size of track selector dropdown arrow |
| --eva-track-selector-dropdown-arrow-color | rgba(255, 255, 255, 0.6) | Color of track selector dropdown arrow |
| --eva-track-selector-hover-background | rgba(255, 255, 255, 0.1) | Hover background for track selector |
| --eva-track-selector-opened-background | rgba(255, 255, 255, 0.15) | Background when track selector is opened |
| --eva-track-selector-dropdown-content-background | rgba(28, 28, 30, 0.95) | Background of track selector dropdown panel |
| --eva-track-selector-dropdown-content-box-shadow | 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) | Box shadow of track selector dropdown |
| --eva-track-selector-dropdown-content-header-font-size | 14px | Font size of dropdown header |
| --eva-track-selector-dropdown-content-header-font-color | rgba(255, 255, 255, 0.5) | Color of dropdown header text |
| --eva-track-selector-dropdown-content-header-bottom-border | 1px solid rgba(255, 255, 255, 0.1) | Bottom border of dropdown header |
| --eva-track-selector-dropdown-content-speed-option-bacground-hover | rgba(255, 255, 255, 0.1) | Hover background for track options |
| --eva-track-selector-dropdown-content-speed-option-icon-active | rgba(59, 130, 246, 0.3) | Background of active track option icon |
| --eva-track-selector-dropdown-content-speed-option-font-size | 14px | Font size of track options |
| --eva-track-selector-dropdown-content-speed-option-font-color | rgba(255, 255, 255, 0.95) | Text color of track options |
| --eva-track-selector-dropdown-content-speed-option-checkmark-size | 16px | Size of checkmark icon |
| --eva-track-selector-dropdown-content-speed-option-checkmark-color | rgb(59, 130, 246) | Color of checkmark icon |
| --eva-volume-background-color | rgba(255, 255, 255, 0.2) | Background of volume slider |
| --eva-volume-value-background-color | white | Filled portion of volume slider |
| --eva-volume-knob-background-color | white | Background color of volume knob |
| --eva-volume-knob-size | 15px | Size of volume knob |
| --eva-volume-knob-box-shadow | 0 1px 3px rgba(0, 0, 0, 0.2) | Shadow applied to volume knob |
