
## Aria Types

All aria input types follow the same pattern: an optional input type (e.g. `EvaFullscreenAria`) whose properties are all optional, and a transformed counterpart with all properties required (e.g. `EvaFullscreenAriaTransformed`). Default values are applied automatically when a property is omitted.

---

### `EvaFullscreenAria`

| Property | Default |
|---|---|
| `enterFullscreen` | `"Enter fullscreen"` |
| `exitFullscreen` | `"Exit fullscreen"` |

---

### `EvaMuteAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"mute"` |
| `ariaValueTextMuted` | `"Muted"` |
| `ariaValueTextUnmuted` | `"Unmuted"` |

---

### `EvaPlayPauseAria`

| Property | Default |
|---|---|
| `ariaLabel.play` | `"play"` |
| `ariaLabel.pause` | `"pause"` |
| `ariaValueText.playing` | `"playing"` |
| `ariaValueText.loading` | `"loading"` |
| `ariaValueText.paused` | `"paused"` |
| `ariaValueText.ended` | `"ended"` |
| `ariaValueText.errored` | `"errored"` |

---

### `EvaPlaybackSpeedAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Playback speed"` |

---

### `EvaTimeDisplayAria`

The active property depends on the `EvaTimeProperty` set on the component.

| Property | Used when `evaTimeProperty` is | Default |
|---|---|---|
| `ariaLabelCurrent` | `"current"` | `"Current time display"` |
| `ariaLabelTotal` | `"total"` | `"Duration display"` |
| `ariaLabelRemaining` | `"remaining"` | `"Remaining time display"` |

---

### `EvaScrubBarAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Scrub bar"` |

---

### `EvaVolumeAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Volume control"` |

---

### `EvaOverlayPlayAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Overlay play"` |