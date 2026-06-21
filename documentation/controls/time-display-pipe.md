## EvaTimeDisplayPipe

A pure pipe that formats a time value in seconds into a display string. Re-evaluates only when its input references change.

### Pipe Name

```
evaTimeDisplay
```

### Signature

```ts
value | evaTimeDisplay : formating : timeProperty
```

| Parameter | Type | Description |
|---|---|---|
| `value` | `number` | Time value in seconds to format. |
| `formating` | `EvaTimeFormating` | Target display format. See [Types — `EvaTimeFormating`](#). |
| `timeProperty` | `EvaTimeProperty` | The time property being displayed. Affects rounding — `"remaining"` uses `Math.ceil`, all others use `Math.floor`. |

### Usage

```html
<!-- Basic formatting -->
{{ time.current | evaTimeDisplay:'mm:ss':'current' }}
{{ time.remaining | evaTimeDisplay:'HH:mm:ss':'remaining' }}

<!-- Total duration in seconds -->
{{ time.total | evaTimeDisplay:'ss':'total' }}

<!-- Inside a custom component reading EvaApi.time() -->
<span>{{ playerApi.time().current | evaTimeDisplay:'mm:ss':'current' }}</span>
<span> / </span>
<span>{{ playerApi.time().total | evaTimeDisplay:'mm:ss':'total' }}</span>

<!-- Remaining time with hours format -->
<p>Time left: {{ playerApi.time().remaining | evaTimeDisplay:'HH:mm:ss':'remaining' }}</p>
```

### Format Outputs

| Format | Example output | Notes |
|---|---|---|
| `'HH:mm:ss'` | `"01:23:45"` | Zero-padded hours, minutes, and seconds. |
| `'mm:ss'` | `"83:45"` | Total minutes including hour overflow, zero-padded. |
| `'ss'` | `"5025"` | Total seconds as a plain integer string. |
| _(unrecognised)_ | `"00:00"` | Default fallback. |

### Rounding Behaviour

- `"remaining"` — uses `Math.ceil` so the display never prematurely reaches zero before the video ends.
- `"current"` / `"total"` — uses `Math.floor`.
- Negative values are clamped to `0` in all cases.