## EvaCinemaMode

Cinema mode toggle button for the Eva video player. Expands the player and dims the surrounding page content with a backdrop overlay. The component provides the toggle signal and backdrop — the consumer's CSS controls the actual layout change.

### Selector

```html
<eva-cinema-mode />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, hides the built-in SVG icon and uses projected content. |
| `evaAria` | `EvaCinemaModeAria` | No | See below | ARIA labels for the button. |

### Outputs

| Output | Type | Description |
|---|---|---|
| `evaCinemaToggled` | `boolean` | Emitted when cinema mode is toggled. `true` when entering, `false` when exiting. |

### How It Works

When toggled on:
1. The `eva-cinema-mode` CSS class is added to the parent `<eva-player>` host element.
2. A backdrop `<div class="eva-cinema-backdrop">` is appended to `document.body`, dimming the surrounding page.
3. `evaCinemaToggled` emits `true`.

When toggled off (via button, backdrop click, or component destruction):
1. The `eva-cinema-mode` class is removed from the player.
2. The backdrop is removed from `document.body`.
3. `evaCinemaToggled` emits `false`.

### Usage

```html
<!-- Basic cinema mode button -->
<eva-player id="my-player" [evaVideoSources]="sources()">
  <eva-controls-container evaUserInteractionEvents [evaAutohide]="true">
    <eva-play-pause />
    <eva-controls-divider />
    <eva-cinema-mode (evaCinemaToggled)="isCinema.set($event)" />
    <eva-fullscreen />
  </eva-controls-container>
</eva-player>

<!-- Custom icon -->
<eva-cinema-mode [evaCustomIcon]="true" (evaCinemaToggled)="isCinema.set($event)">
  <img src="assets/theater.svg" alt="" />
</eva-cinema-mode>
```

### Consumer CSS

The component does not force a layout. The consumer targets the `eva-cinema-mode` class to control how the player expands:

```css
/* Full-width cinema mode */
eva-player.eva-cinema-mode {
  position: relative;
  z-index: 1000;
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(-50vw + 50%);
}

/* Or a simpler approach with a fixed max-width */
eva-player.eva-cinema-mode {
  position: relative;
  z-index: 1000;
  max-width: 1200px;
  margin: 0 auto;
}
```

### Consumer Example

```typescript
import { Component, signal } from '@angular/core';
import { EvaCinemaMode, EvaPlayer } from 'ez-vid-ang';

@Component({
  selector: 'app-player',
  imports: [EvaPlayer, EvaCinemaMode],
  template: `
    <eva-player id="player" [evaVideoSources]="sources()">
      <eva-cinema-mode (evaCinemaToggled)="isCinema.set($event)" />
    </eva-player>
    <aside [class.hidden]="isCinema()">Sidebar content</aside>
  `,
  styles: `
    eva-player.eva-cinema-mode {
      position: relative;
      z-index: 1000;
      width: 100vw;
      margin-left: calc(-50vw + 50%);
    }
    .hidden { display: none; }
  `
})
export class PlayerComponent {
  protected readonly sources = signal([{ src: 'video.mp4', type: 'video/mp4' }]);
  protected readonly isCinema = signal(false);
}
```

### Backdrop

The backdrop is a `<div class="eva-cinema-backdrop">` appended to `document.body`. Its styles are defined in `eva-required-import.scss` (global). Clicking the backdrop exits cinema mode.

The backdrop fades in using a CSS animation that respects `--eva-transition-duration`.

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` / `Space` | Toggle cinema mode |

### Host Classes

| Class | When applied |
|---|---|
| `eva-cinema-mode-active` | Cinema mode is currently on |

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-control-element-height` | inherited | Height of the button. |
| `--eva-icon-color` | inherited | Color of the built-in icon. |
| `--eva-cinema-backdrop-z-index` | `999` | z-index of the backdrop overlay. |
| `--eva-cinema-backdrop-background` | `rgba(0, 0, 0, 0.7)` | Background/opacity of the backdrop. |
| `--eva-transition-duration` | `0.25s` | Duration of the backdrop fade-in animation. |

### `EvaCinemaModeAria`

| Property | Type | Default | Description |
|---|---|---|---|
| `ariaLabel` | `string` | `"Cinema mode"` | Static `aria-label` for the button. |
| `ariaValueText.active` | `string` | `"Cinema mode is on"` | `aria-valuetext` when active. |
| `ariaValueText.inactive` | `string` | `"Cinema mode is off"` | `aria-valuetext` when inactive. |

### Notes

- The player must have `position: relative` and a `z-index` higher than the backdrop (`999`) for it to appear above the dimmed page.
- Cinema mode auto-deactivates on `ngOnDestroy` (e.g. navigating away), cleaning up the class and backdrop.
- The backdrop click listener is cleaned up properly to prevent memory leaks.

### Settings Panel Integration

You can add a cinema mode toggle to the `EvaSettingsPanel`. The `<eva-cinema-mode />` component must still be in the template — it subscribes to `cinemaModeSubject` and manages the backdrop:

```html
<eva-player>
  <eva-cinema-mode />
  <eva-controls-container>
    <eva-settings-panel [evaSettingsMenuItems]="settingsItems()" (evaSettingsMenuItemSelected)="onSettingChanged($event)" />
  </eva-controls-container>
</eva-player>
```

```typescript
private isCinemaMode = false;

protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  { id: 'cinema', label: 'Cinema mode', currentValue: 'Off' },
]);

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'cinema') {
    this.isCinemaMode = !this.isCinemaMode;
    this.api.cinemaModeSubject.next(this.isCinemaMode);
    this.settingsItems.update(items =>
      items.map(item =>
        item.id === 'cinema'
          ? { ...item, currentValue: this.isCinemaMode ? 'On' : 'Off' }
          : item,
      ),
    );
  }
}
```
