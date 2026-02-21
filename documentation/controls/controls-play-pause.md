## EvaPlayPause

A play/pause toggle button rendered as a `role="button"` element. Tracks the current video state via `EvaApi` and updates its icon, `aria-label`, and `aria-valuetext` accordingly. Built-in icons can be replaced via content projection.

### Selector

```html
<eva-play-pause />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaPlayPauseAria` | `EvaPlayPauseAria` | No | See [Aria Types — `EvaPlayPauseAria`](#) | ARIA labels and value texts for each playback state. |
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses all built-in icon classes so a custom icon can be projected instead. |

### Usage

```html
<!-- Minimal usage -->
<eva-play-pause />

<!-- Custom ARIA labels -->
<eva-play-pause
  [evaPlayPauseAria]="{
    ariaLabel: { play: 'Play', pause: 'Pause' },
    ariaValueText: { playing: 'Playing', paused: 'Paused', loading: 'Loading', ended: 'Ended', errored: 'Error' }
  }"
/>

<!-- Custom icon via content projection -->
<eva-play-pause [evaCustomIcon]="true">
  <img evaPlay src="play-icon.svg" />
  <img evaPause src="pause-icon.svg" />
</eva-play-pause>
```

### Icon States

| State | Built-in icon class |
|---|---|
| `playing` | `eva-icon-pause` |
| `loading`, `paused`, `ended`, `error` | `eva-icon-play_arrow` |

Built-in icon classes are suppressed entirely when `evaCustomIcon` is `true`.

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` | Toggle play/pause |
| `Space` | Toggle play/pause |