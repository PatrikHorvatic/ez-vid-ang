## EvaControlsContainer

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
<eva-controls-container></eva-controls-container>

<!-- Auto-hide after 4 seconds of inactivity -->
<eva-controls-container [evaAutohide]="true" [evaAutohideTime]="4000"></eva-controls-container>

<!-- With user interaction detection for auto-hide (recommended) -->
<eva-controls-container evaUserInteractionEvents [evaAutohide]="true">
  <eva-play-pause />
  <eva-volume />
  <eva-fullscreen />
</eva-controls-container>

<!-- Full controls bar with divider separating left and right groups -->
<eva-controls-container evaUserInteractionEvents [evaAutohide]="true" [evaAutohideTime]="3000">
  <eva-play-pause />
  <eva-backward />
  <eva-forward />
  <eva-time-display evaTimeProperty="current" evaTimeFormating="mm:ss" />

  <eva-controls-divider />

  <eva-mute />
  <eva-volume />
  <eva-playback-speed [evaPlaybackSpeeds]="[0.5, 1, 1.5, 2]" />
  <eva-track-selector />
  <eva-quality-selector />
  <eva-picture-in-picture />
  <eva-fullscreen />
</eva-controls-container>

<!-- Minimal player with no auto-hide -->
<eva-controls-container>
  <eva-play-pause />
  <eva-time-display evaTimeProperty="current" evaTimeFormating="mm:ss" />
  <eva-controls-divider />
  <eva-time-display evaTimeProperty="total" evaTimeFormating="mm:ss" />
</eva-controls-container>
```

### Auto-hide Behaviour

The hide timer resets on every user interaction event emitted by `EvaApi.triggerUserInteraction`. Use `evaUserInteractionEvents` on the `eva-controls-container` element to wire up interaction detection automatically.

Toggling `evaAutohide` at runtime is supported:
- Switched to `true` — starts listening for interactions and schedules the first hide. Any previous subscriptions are cleaned up before new ones are created.
- Switched to `false` — cancels any pending timeout, unsubscribes from both user interaction and selector-active streams, and immediately shows the controls.

The auto-hide timer is also paused while a selector dropdown (quality, speed, track) is open, and resumes when it closes. The hide timeout is cleared on component destruction to prevent post-destroy callbacks.

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-controls-container-background-color` | `rgb(0, 0, 0)` | Background color of the controls container. |
| `--eva-controls-container-controls-spacing` | `4px` | Spacing between controls inside the container. |