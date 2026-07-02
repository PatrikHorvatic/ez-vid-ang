## EvaLoop

A loop toggle button rendered as a `role="button"` element. Toggles the native `HTMLVideoElement.loop` property and reflects the current state through an `eva-loop-active` host class and dynamic ARIA attributes. The built-in icon can be replaced via content projection.

### Selector

```html
<eva-loop />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaAria` | `EvaLoopAria` | No | See [`EvaLoopAria`](#evaloooparia) | ARIA labels for the loop button. |
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead. |

### Icon Registry Keys

The built-in icon uses the `loop` registry key. Register it before using the component:

```typescript
import { addEvaIcons } from 'ez-vid-ang';
import { evaLoopIcon } from 'ez-vid-ang/icons';
addEvaIcons({ evaLoopIcon });
```

### Usage

```html
<!-- Minimal usage -->
<eva-loop />

<!-- Custom ARIA labels -->
<eva-loop [evaAria]="{ ariaLabel: 'Repeat', ariaValueText: { active: 'Repeat on', inactive: 'Repeat off' } }" />

<!-- Custom icon via content projection -->
<eva-loop [evaCustomIcon]="true">
  <img src="your-loop-icon.svg" />
</eva-loop>

<!-- Inside a controls bar -->
<eva-controls-container>
  <eva-play-pause />
  <eva-backward />
  <eva-forward />
  <eva-controls-divider />
  <eva-loop />
  <eva-playback-speed [evaPlaybackSpeeds]="[0.5, 1, 1.5, 2]" />
  <eva-fullscreen />
</eva-controls-container>
```

### Host Classes

| Class | Applied when |
|---|---|
| `eva-loop-active` | Loop is currently enabled. The built-in icon is shown at full opacity. |

When loop is inactive, the icon is rendered at `0.6` opacity.

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` | Toggle loop |
| `Space` | Toggle loop |

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-control-element-height` | `50px` | Height of the host element. |
| `--eva-icon-color` | `white` | Fill color of the built-in SVG icon. |

### `EvaLoopAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Loop"` |
| `ariaValueText.active` | `"Loop is on"` |
| `ariaValueText.inactive` | `"Loop is off"` |

### Settings Panel Integration

Instead of using `<eva-loop>` as a standalone button, you can add a loop toggle to the `EvaSettingsPanel`:

```typescript
private isLooping = false;

protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  { id: 'loop', label: 'Loop', currentValue: 'Off' },
]);

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'loop') {
    this.isLooping = !this.isLooping;
    const video = this.api.assignedVideoElement;
    if (video) {
      video.loop = this.isLooping;
      this.api.loopSubject.next(this.isLooping);
    }
    this.settingsItems.update(items =>
      items.map(item =>
        item.id === 'loop'
          ? { ...item, currentValue: this.isLooping ? 'On' : 'Off' }
          : item,
      ),
    );
  }
}
```
