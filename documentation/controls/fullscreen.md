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
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead. |

### Icon Registry Keys

| State | Registry key |
|---|---|
| Normal | `fullscreen` |
| In fullscreen | `fullscreen-exit` |

Register icons before using the component:

```typescript
import { addEvaIcons } from 'ez-vid-ang';
import { evaFullscreenIcon, evaFullscreenExitIcon } from 'ez-vid-ang/icons';
addEvaIcons({ evaFullscreenIcon, evaFullscreenExitIcon });
```

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

<!-- Typically placed at the end of the controls bar -->
<eva-controls-container>
  <eva-play-pause />
  <eva-time-display evaTimeProperty="current" evaTimeFormating="mm:ss" />
  <eva-controls-divider />
  <eva-picture-in-picture />
  <eva-fullscreen />
</eva-controls-container>
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

### Settings Panel Integration

You can add a fullscreen toggle to the `EvaSettingsPanel` using `EvaFullscreenAPI`:

```typescript
import { EvaFullscreenAPI } from 'ez-vid-ang';

private readonly fullscreenService = inject(EvaFullscreenAPI);

protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  { id: 'fullscreen', label: 'Fullscreen' },
]);

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'fullscreen') {
    this.fullscreenService.toggleFullscreen();
  }
}
```