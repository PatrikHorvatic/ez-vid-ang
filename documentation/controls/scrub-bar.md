## EvaScrubBar

A seek/scrub bar component rendered as a `role="slider"` element. Supports click-to-seek, drag-to-seek, touch seeking, chapter markers, a hover time tooltip, and optional auto-hide behaviour in sync with the controls container.

Mouse and touch event listeners are registered outside Angular's zone to avoid unnecessary change detection. Signal updates are explicitly brought back into the zone when needed.

### Selector

```html
<eva-scrub-bar />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaAria` | `EvaScrubBarAria` | No | See [`EvaScrubBarAria`](#) | ARIA label for the scrub bar slider. |
| `hideWithControlsContainer` | `boolean` | No | `false` | When `true`, the scrub bar participates in the controls container auto-hide behaviour. |
| `evaAutohideTime` | `number` | No | `3000` | Milliseconds of inactivity before the scrub bar hides. Only applies when `hideWithControlsContainer` is `true`. |
| `evaSlidingEnabled` | `boolean` | No | `true` | When `true`, click-and-drag seeking is supported. When `false`, only click-to-seek is supported. |
| `evaShowTimeOnHover` | `boolean` | No | `true` | When `true`, a tooltip showing the time at the hovered position is displayed while the mouse is over the bar. |
| `evaTimeFormat` | `EvaTimeFormating` | No | `'mm:ss'` | Format used for the hover tooltip and any internal time display. See [Types — `EvaTimeFormating`](#). |
| `evaShowChapters` | `boolean` | No | `true` | When `true`, chapter markers are rendered on the bar. |
| `evaChapters` | `EvaChapterMarker[]` | No | `[]` | Chapter markers to display. Takes priority over any VTT text track on the video element. See [Types — `EvaChapterMarker`](#). |
| `evaThumbnailVtt` | `string` | No | `''` | URL to a VTT file that maps time ranges to regions in a thumbnail sprite image. When provided, a thumbnail preview is shown above the scrub bar on hover. |

### Usage

```html
<!-- Minimal usage -->
<eva-scrub-bar />

<!-- With buffer and current time indicators (recommended) -->
<eva-scrub-bar>
  <eva-scrub-bar-buffering-time />
  <eva-scrub-bar-current-time />
</eva-scrub-bar>

<!-- With chapters and custom time format -->
<eva-scrub-bar
  [evaChapters]="chapters"
  evaTimeFormat="HH:mm:ss"
/>

<!-- Auto-hide in sync with controls container -->
<eva-scrub-bar [hideWithControlsContainer]="true" [evaAutohideTime]="4000">
  <eva-scrub-bar-buffering-time />
  <eva-scrub-bar-current-time />
</eva-scrub-bar>

<!-- Click-to-seek only (no drag) with no hover tooltip -->
<eva-scrub-bar [evaSlidingEnabled]="false" [evaShowTimeOnHover]="false">
  <eva-scrub-bar-current-time />
</eva-scrub-bar>

<!-- Custom ARIA label and HH:mm:ss hover tooltip for long videos -->
<eva-scrub-bar
  [evaAria]="{ ariaLabel: 'Video progress' }"
  evaTimeFormat="HH:mm:ss"
  [evaShowChapters]="true"
>
  <eva-scrub-bar-buffering-time />
  <eva-scrub-bar-current-time />
</eva-scrub-bar>

<!-- Full player layout with scrub bar outside the controls container -->
<eva-player id="my-player" [evaVideoSources]="sources">
  <eva-buffering />
  <eva-overlay-play />

  <eva-scrub-bar [hideWithControlsContainer]="true" [evaShowChapters]="true">
    <eva-scrub-bar-buffering-time />
    <eva-scrub-bar-current-time />
  </eva-scrub-bar>

  <eva-subtitle-display />

  <eva-controls-container evaUserInteractionEvents [evaAutohide]="true">
    <eva-play-pause />
    <eva-time-display evaTimeProperty="current" evaTimeFormating="mm:ss" />
    <eva-controls-divider />
    <eva-time-display evaTimeProperty="total" evaTimeFormating="mm:ss" />
    <eva-fullscreen />
  </eva-controls-container>
</eva-player>
```

### Thumbnail Preview

When `evaThumbnailVtt` is provided, a thumbnail preview of the video frame is shown above the scrub bar while hovering. The thumbnail appears alongside the existing time tooltip.

#### VTT File Format

The VTT file maps time ranges to rectangular regions in a sprite image using the `#xywh=x,y,w,h` URI fragment:

```
WEBVTT

00:00:00.000 --> 00:00:05.000
thumbnails.jpg#xywh=0,0,160,90

00:00:05.000 --> 00:00:10.000
thumbnails.jpg#xywh=160,0,160,90

00:00:10.000 --> 00:00:15.000
thumbnails.jpg#xywh=320,0,160,90
```

Each cue contains:
- A time range (`start --> end`)
- A sprite image URL with `#xywh=x,y,width,height` specifying which rectangle to display

#### Generating Thumbnails

Use `ffmpeg` to generate the sprite image and a tool like `vtt-thumbnail-generator` for the VTT file:

```bash
# Extract a frame every 5 seconds, scaled to 160x90, tiled in a 10-column grid
ffmpeg -i video.mp4 -vf "fps=1/5,scale=160:90,tile=10x10" thumbnails.jpg
```

#### Usage

```html
<!-- With thumbnail preview -->
<eva-scrub-bar
  [evaThumbnailVtt]="'assets/thumbnails.vtt'"
  [evaShowTimeOnHover]="true"
>
  <eva-scrub-bar-buffering-time />
  <eva-scrub-bar-current-time />
</eva-scrub-bar>

<!-- With thumbnail preview and chapters -->
<eva-scrub-bar
  [evaThumbnailVtt]="thumbnailVttUrl()"
  [evaShowTimeOnHover]="true"
  [evaShowChapters]="true"
  [evaChapters]="chapters()"
>
  <eva-scrub-bar-buffering-time />
  <eva-scrub-bar-current-time />
</eva-scrub-bar>

<!-- Dynamic — updates when the video source changes -->
<eva-scrub-bar [evaThumbnailVtt]="currentThumbnailVtt()">
  <eva-scrub-bar-buffering-time />
  <eva-scrub-bar-current-time />
</eva-scrub-bar>
```

#### VTT Validation

The parser validates each cue and silently skips invalid entries:

| Condition | Result |
|---|---|
| Missing `-->` time line | Cue skipped |
| Missing image line | Cue skipped |
| Unparseable timestamp | Cue skipped |
| `endTime <= startTime` | Cue skipped |
| Missing `#xywh=` fragment | Cue skipped — sprite coordinates are required |
| Negative x, y, width, or height | Cue skipped |
| Zero or negative width/height | Cue skipped — prevents invisible thumbnails |
| Non-finite coordinate values | Cue skipped |

Valid cues must have:
- A parseable time range with `endTime > startTime`
- An image URL with `#xywh=x,y,width,height` where all values are finite, non-negative, and width/height are greater than zero

#### Runtime Behaviour

- **VTT URL changes** — the previous fetch is aborted via `AbortController`, stale thumbnails are cleared immediately, and the new VTT is fetched and parsed.
- **Component destroyed during fetch** — the in-flight fetch is cancelled via `AbortController`.
- **VTT cleared** — setting `evaThumbnailVtt` to an empty string clears all thumbnails.
- **Relative sprite URLs** — sprite image paths in the VTT file are resolved relative to the VTT file's location (e.g. if the VTT is at `assets/thumbnails.vtt` and a cue references `sprites.jpg`, the resolved URL is `assets/sprites.jpg`). Absolute URLs (`https://...`) and root-relative URLs (`/assets/...`) are used as-is.
- **Sprite preloading** — unique sprite image URLs are preloaded after parsing to avoid flicker on first hover.
- **No VTT or failed fetch** — the hover tooltip shows just the time (and chapter if applicable), with no thumbnail. No errors are thrown.
- **Edge clamping** — the thumbnail tooltip is clamped within the scrub bar boundaries. Near the left/right edges, the tooltip shifts inward based on half the thumbnail width to prevent overflow.

#### Thumbnail SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-scrub-bar-thumbnail-border-radius` | `4px` | Border radius of the thumbnail preview. |
| `--eva-scrub-bar-thumbnail-border` | `2px solid rgba(255, 255, 255, 0.9)` | Border around the thumbnail preview. |
| `--eva-scrub-bar-thumbnail-box-shadow` | `0 2px 8px rgba(0, 0, 0, 0.4)` | Box shadow of the thumbnail preview. |

### Chapter Markers

Chapter markers are resolved in the following priority order:

1. `evaChapters` input — used directly if non-empty. Also synced to `EvaApi.chapterMarkerChangesSubject` so that `EvaActiveChapter` and the per-frame chapter lookup in `updateVideoTime()` use the same data.
2. VTT text track — falls back to a `chapters` or `metadata` kind track on the video element. If the player is not yet ready, loading is deferred until `playerReadyEvent` fires. VTT-parsed chapters are skipped when `evaChapters` is provided.

### Auto-hide Behaviour

When `hideWithControlsContainer` is `true`, the scrub bar hides after `evaAutohideTime` ms of inactivity. The hide timer is reset on every user interaction event from `EvaApi.triggerUserInteraction`.

The auto-hide is paused while a selector dropdown (quality, speed, track) is open — the bar will not disappear behind an open dropdown. The hide timer resumes when the dropdown closes.

### Touch Support

Touch seeking works the same as mouse seeking:
- With `evaSlidingEnabled` = `true` — touch-and-drag to seek.
- With `evaSlidingEnabled` = `false` — tap to seek to that position.

### Keyboard Support

All keyboard seeking is disabled for live streams.

| Key | Action |
|---|---|
| `ArrowRight` / `ArrowUp` | Seek forward |
| `ArrowLeft` / `ArrowDown` | Seek back |

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-scrub-bar-heights` | `5px` | Height of the scrub bar track. |
| `--eva-scrub-bar-background` | `rgb(54, 54, 54)` | Background color of the unfilled track. |
| `--eva-scrub-bar-buffering-background` | `gray` | Color of the buffered range indicator. |
| `--eva-scrub-bar-current-time-background` | `green` | Color of the elapsed time fill. |
| `--eva-scrub-bar-chapter-marker-color` | `rgba(255, 255, 255, 0.5)` | Color of chapter marker dividers on the track. |
| `--eva-scrub-bar-chapter-marker-width` | `3px` | Width of chapter marker dividers. |
| `--eva-scrub-bar-chapter-hover-background-color` | `rgba(0, 0, 0, 0.85)` | Background of the chapter hover area. |
| `--eva-scrub-bar-chapter-hover-text-color` | `white` | Text color of the chapter hover area. |
| `--eva-scrub-bar-chapter-hover-font-size` | `14px` | Font size of the chapter hover area. |
| `--eva-scrub-bar-chapter-hover-tooltip-background-color` | `rgba(0, 0, 0, 0.75)` | Background of the hover time tooltip. |
| `--eva-scrub-bar-chapter-hover-tooltip-text-color` | `white` | Text color of the hover time tooltip. |
| `--eva-scrub-bar-chapter-hover-tooltip-font-size` | `14px` | Font size of the hover time tooltip. |

### `EvaScrubBarAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Scrub bar"` |

---
<br />

## EvaScrubBarBufferingTimeComponent

A buffered time indicator sub-component intended to be layered inside `eva-scrub-bar`. Renders a visual representation of the buffered range as a CSS percentage width, showing how much of the video has been loaded ahead of the current playback position.

For live streams, the buffered percentage is always `"0%"` since buffer progress is not meaningful in a live context.

### Selector

```html
<eva-scrub-bar-buffering-time />
```

### Usage

```html
<eva-scrub-bar>
  <eva-scrub-bar-buffering-time />
</eva-scrub-bar>
```

### Buffer Calculation

The buffered percentage is updated from two sources:

- `EvaApi.videoBufferSubject` — fires whenever the browser's buffer changes.
- `EvaApi.videoTimeChangeSubject` — fires on playback time changes, throttled to once every 2 seconds to reduce update frequency during active playback.

The percentage is calculated using the following rules:

| Condition | Result |
|---|---|
| Live stream | Always `"0%"` |
| One buffered range spanning `0` to total duration | `"100%"` |
| Otherwise | End time of the last buffered range ÷ total duration |

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-scrub-bar-buffering-background` | `gray` | Background color of the buffered range indicator. |

---
<br />

## EvaScrubBarCurrentTimeComponent

A current playback position indicator sub-component intended to be layered inside `eva-scrub-bar`. Renders the played portion of the video as a CSS percentage width.

### Selector

```html
<eva-scrub-bar-current-time />
```

### Usage

```html
<eva-scrub-bar>
  <eva-scrub-bar-current-time />
</eva-scrub-bar>
```

### Percentage Calculation

| Condition | Result |
|---|---|
| Time data unavailable | `"0%"` |
| Live stream (`total === Infinity`) | `"100%"` — keeps the indicator pinned to the right |
| VOD | `Math.round(current * 100) / total + "%"` |

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-scrub-bar-current-time-background` | `green` | Color of the elapsed time fill. |