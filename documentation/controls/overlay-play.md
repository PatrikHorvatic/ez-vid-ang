## EvaOverlayPlay

A centered overlay play button that appears over the video when it is in a non-playing state. Hidden automatically during buffering. The built-in icon can be replaced via content projection.

By default the overlay is **not** shown in the `ended` state — use `evaShowPlayOnVideoEnding` to control this. When using `<eva-ended-overlay>`, leave `evaShowPlayOnVideoEnding` at its default (`false`) so the two components do not both render on video end.

### Selector

```html
<eva-overlay-play />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaOvelayPlayAria` | `EvaOverlayPlayAria` | No | See [`EvaOverlayPlayAria`](#) | ARIA label for the overlay button. |
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead. |
| `evaShowPlayOnVideoEnding` | `boolean` | No | `false` | When `true`, the overlay is also shown when the video state is `ENDED`. Leave at `false` when using `<eva-ended-overlay>` to keep the two mutually exclusive. |

### Icon Registry Keys

The built-in icon uses the `play` registry key. Register it before using the component:

```typescript
import { addEvaIcons } from 'ez-vid-ang';
import { evaPlayIcon } from 'ez-vid-ang/icons';
addEvaIcons({ evaPlayIcon });
```

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

The overlay is shown when the video state is `loading`, `paused`, or `error`, AND the player is not buffering. It is hidden during buffering regardless of the current state. The `ended` state is only included when `evaShowPlayOnVideoEnding` is `true`.

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