## EvaBufferingComponent

A buffering indicator component that displays a spinner when the video is in a buffering state. Visibility is driven automatically by `EvaApi.isBuffering()` via the `eva-display-buffering` host class — no manual binding required.

A built-in spinner is rendered by default. It can be replaced with a custom spinner via content projection.

### Selector

```html
<eva-buffering />
```


### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `defaultSpinner` | `boolean` | No | `true` | When `true`, renders the built-in spinner. Set to `false` to suppress it and project a custom spinner instead. |

### Usage

```html
<eva-player>
  <!-- Default built-in spinner -->
  <eva-buffering />
  
  <!-- Custom spinner via content projection -->
  <eva-buffering [defaultSpinner]="false">
    <my-custom-spinner />
  </eva-buffering>
  
  <eva-controls-container>
    <!-- your controls here -->
  </eva-controls-container>
</eva-player>

<!-- Custom text-based loading indicator -->
<eva-player id="my-player" [evaVideoSources]="sources">
  <eva-buffering [defaultSpinner]="false">
    <p>Loading video...</p>
  </eva-buffering>

  <eva-controls-container>
    <eva-play-pause />
  </eva-controls-container>
</eva-player>

<!-- Placement order matters — buffering should appear before controls -->
<eva-player id="my-player" [evaVideoSources]="sources">
  <eva-overlay-play />
  <eva-buffering />
  <eva-scrub-bar>
    <eva-scrub-bar-buffering-time />
    <eva-scrub-bar-current-time />
  </eva-scrub-bar>
  <eva-subtitle-display />
  <eva-controls-container evaUserInteractionEvents [evaAutohide]="true">
    <eva-play-pause />
    <eva-fullscreen />
  </eva-controls-container>
</eva-player>
```

### Host Bindings

| Class | Applied when |
|---|---|
| `eva-display-buffering` | `EvaApi.isBuffering()` returns `true`. |