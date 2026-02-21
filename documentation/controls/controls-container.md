## EvaControlsContainerComponent

A wrapper component for the player control bar that manages its visibility. When auto-hide is enabled, the container hides after a configurable period of inactivity and reappears on any user interaction. The `evaAutohide` input can be toggled at runtime.

### Selector

```html
<eva-controls-container />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaAutohide` | `boolean` | No | `false` | When `true`, the controls hide after `evaAutohideTime` ms of inactivity and reappear on user interaction. Can be toggled at runtime. |
| `evaAutohideTime` | `number` | No | `3000` | Milliseconds of inactivity before the controls hide. Only applies when `evaAutohide` is `true`. |

### Usage

```html
<!-- Always visible -->
<eva-controls-container />

<!-- Auto-hide after 4 seconds of inactivity -->
<eva-controls-container [evaAutohide]="true" [evaAutohideTime]="4000" />
```

### Auto-hide Behaviour

The hide timer resets on every user interaction event emitted by `EvaApi.triggerUserInteraction`. Use `evaUserInteractionEvents` on the `eva-controls-container` element to wire up interaction detection automatically.

Toggling `evaAutohide` at runtime is supported:
- Switched to `true` — starts listening for interactions and schedules the first hide.
- Switched to `false` — cancels any pending timeout, unsubscribes, and immediately shows the controls.

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-controls-container-background-color` | `rgb(0, 0, 0)` | Background color of the controls container. |
| `--eva-controls-container-controls-spacing` | `4px` | Spacing between controls inside the container. |