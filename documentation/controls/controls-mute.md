## EvaMute

A mute/unmute toggle button rendered as a `role="button"` element. Reflects the current volume level through four icon states. Volume thresholds are configurable. Built-in icons can be replaced via content projection.

### Selector

```html
<eva-mute />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaAria` | `EvaMuteAria` | No | See [Aria Types — `EvaMuteAria`](#) | ARIA label and value texts for the muted/unmuted states. |
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses all built-in icon classes so a custom icon can be projected instead. |
| `evaLowVolume` | `number` | No | `0.25` | Volume threshold below which the low volume icon is shown. Clamped to `[0, 1]`. |
| `evaMiddleVolume` | `number` | No | `0.75` | Volume threshold at or above which the high volume icon is shown. Clamped to `[0, 1]`. |

### Usage

```html
<!-- Minimal usage -->
<eva-mute />

<!-- Custom ARIA labels -->
<eva-mute [evaAria]="{ ariaLabel: 'Toggle sound', ariaValueTextMuted: 'Sound off', ariaValueTextUnmuted: 'Sound on' }" />

<!-- Custom icon with adjusted thresholds -->
<eva-mute [evaCustomIcon]="true" [evaLowVolume]="0.33" [evaMiddleVolume]="0.66">
  <p evaVolumeOff>Off</p>
  <p evaVolumeLow>Low</p>
  <p evaVolumeMiddle>Middle</p>
  <p evaVolumeUp>Up</p>
</eva-mute>
```

### Icon States

| Condition | Built-in icon class |
|---|---|
| `volume >= evaMiddleVolume` | `eva-icon-volume_up` |
| `volume >= evaLowVolume` and `< evaMiddleVolume` | `eva-icon-volume_middle` |
| `volume > 0` and `< evaLowVolume` | `eva-icon-volume_low` |
| `volume === 0` | `eva-icon-volume_off` |

Built-in icon classes are suppressed entirely when `evaCustomIcon` is `true`.

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` | Toggle mute/unmute |
| `Space` | Toggle mute/unmute |