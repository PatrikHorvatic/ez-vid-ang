## EvaFullscreen

A fullscreen toggle button rendered as a `role="button"` element. Tracks fullscreen state via `EvaFullscreenAPI` and updates `aria-label` accordingly. Toggles fullscreen on the nearest `eva-player` container. The built-in icon can be replaced via content projection.

### Selector

```html
<eva-fullscreen />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaAria` | `EvaFullscreenAria` | No | See [`EvaFullscreenAria`](#aria) | ARIA labels for the enter and exit fullscreen states. |
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses all built-in icon classes so a custom icon can be projected instead. |

### Usage

```html
<!-- Minimal usage -->
<eva-fullscreen />

<!-- Custom ARIA labels -->
<eva-fullscreen [evaAria]="{ enterFullscreen: 'Go fullscreen', exitFullscreen: 'Exit fullscreen' }" />

<!-- Custom icon via content projection -->
<eva-fullscreen [evaCustomIcon]="true">
  <img src="your-image" />
</eva-fullscreen>
```

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` | Toggle fullscreen |
| `Space` | Toggle fullscreen |

<a name="aria"></a>
### `EvaFullscreenAria`

| Property | Default |
|---|---|
| `enterFullscreen` | `"Enter fullscreen"` |
| `exitFullscreen` | `"Exit fullscreen"` |