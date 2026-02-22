## EvaOverlayPlay

A centered overlay play button that appears over the video when it is in a non-playing state (`loading`, `paused`, `ended`, or `error`). Hidden automatically during buffering. The built-in icon can be replaced via content projection.

### Selector

```html
<eva-overlay-play />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaOvelayPlayAria` | `EvaOverlayPlayAria` | No | See [`EvaOverlayPlayAria`](#) | ARIA label for the overlay button. |
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses all built-in icon classes so a custom icon can be projected instead. |

### Usage

```html
<!-- Minimal usage -->
<eva-overlay-play />

<!-- Custom ARIA label -->
<eva-overlay-play [evaOvelayPlayAria]="{ ariaLabel: 'Play video' }" />

<!-- Custom icon via content projection -->
<eva-overlay-play [evaCustomIcon]="true">
  <p>Custom content</p>
</eva-overlay-play>
```

### Visibility

The overlay is shown when the video state is `loading`, `paused`, `ended`, or `error`, AND the player is not buffering. It is hidden during buffering regardless of the current state.

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` | Toggle play/pause |
| `Space` | Toggle play/pause |

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-overlay-play-background-color` | `rgba(0, 0, 0, 0.7)` | Background color of the overlay play button. |


### `EvaOverlayPlayAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Overlay play"` |