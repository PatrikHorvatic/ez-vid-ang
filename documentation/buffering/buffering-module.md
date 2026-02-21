## EvaBufferingComponent

A buffering indicator component that displays a spinner when the video is in a buffering state. Visibility is driven automatically by `EvaApi.isBuffering()` via the `eva-display-buffering` host class — no manual binding required.

A built-in spinner is rendered by default. It can be replaced with a custom spinner via content projection.

---

### Selector

```html
<eva-buffering />
```

---

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `defaultSpinner` | `boolean` | No | `true` | When `true`, renders the built-in spinner. Set to `false` to suppress it and project a custom spinner instead. |

---

### Usage

```html
<!-- Default built-in spinner -->
<eva-buffering />

<!-- Custom spinner via content projection -->
<eva-buffering [defaultSpinner]="false">
  <my-custom-spinner />
</eva-buffering>
```

---

### Host Bindings

| Class | Applied when |
|---|---|
| `eva-display-buffering` | `EvaApi.isBuffering()` returns `true`. |