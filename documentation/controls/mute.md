## EvaMute

A mute/unmute toggle button rendered as a `role="button"` element. Reflects the current volume level through four icon states. Volume thresholds are configurable. Built-in icons can be replaced via content projection.

### Selector

```html
<eva-mute />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaAria` | `EvaMuteAria` | No | See [`EvaMuteAria`](#) | ARIA label and value texts for the muted/unmuted states. |
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead. |
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

### Icon Registry Keys

| Condition | Registry key |
|---|---|
| `volume >= evaMiddleVolume` | `volume-high` |
| `volume >= evaLowVolume` and `< evaMiddleVolume` | `volume-medium` |
| `volume > 0` and `< evaLowVolume` | `volume-low` |
| `volume === 0` | `volume-mute` |

Register icons before using the component:

```typescript
import { addEvaIcons } from 'ez-vid-ang';
import { evaVolumeHighIcon, evaVolumeMediumIcon, evaVolumeLowIcon, evaVolumeMuteIcon } from 'ez-vid-ang/icons';
addEvaIcons({ evaVolumeHighIcon, evaVolumeMediumIcon, evaVolumeLowIcon, evaVolumeMuteIcon });
```

When `evaCustomIcon` is `true`, the registry icon is suppressed and `<ng-content>` is rendered instead.

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` | Toggle mute/unmute |
| `Space` | Toggle mute/unmute |

### `EvaMuteAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"mute"` |
| `ariaValueTextMuted` | `"Muted"` |
| `ariaValueTextUnmuted` | `"Unmuted"` |

### Settings Panel Integration

You can add a mute toggle to the `EvaSettingsPanel`:

```typescript
private isMuted = false;

protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  { id: 'mute', label: 'Mute', currentValue: 'Off' },
]);

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'mute') {
    this.api.muteOrUnmuteVideo();
    this.isMuted = !this.isMuted;
    this.settingsItems.update(items =>
      items.map(item =>
        item.id === 'mute'
          ? { ...item, currentValue: this.isMuted ? 'On' : 'Off' }
          : item,
      ),
    );
  }
}
```