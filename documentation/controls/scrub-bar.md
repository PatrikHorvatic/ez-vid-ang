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