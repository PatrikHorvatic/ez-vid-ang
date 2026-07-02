# EvaCinemaMode

## Overview

`EvaCinemaMode` is a pure state toggle button for cinema mode. On click or keyboard activation it updates `EvaApi.cinemaModeSubject` and emits `evaCinemaToggled` — nothing else. It does not touch the `<eva-player>` element, does not set any CSS class, does not manipulate layout, and has no cleanup on destroy. Everything cinema mode *looks like* is entirely the consumer's responsibility.

Place it inside `<eva-controls-container>` alongside other control buttons.

**Selector:** `eva-cinema-mode`

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead. |
| `evaAria` | `EvaCinemaModeAria` | No | See below | ARIA labels for the button. |

### Icon Registry Keys

The built-in icon uses the `cinema-mode` registry key. Register it before using the component:

```typescript
import { addEvaIcons } from 'ez-vid-ang';
import { evaCinemaModeIcon } from 'ez-vid-ang/icons';
addEvaIcons({ evaCinemaModeIcon });
```

### Outputs

| Output | Type | Description |
|---|---|---|
| `evaCinemaToggled` | `boolean` | Emitted on every toggle. `true` when entering cinema mode, `false` when exiting. |

### How It Works

When toggled on:
1. `EvaApi.cinemaModeSubject` emits `true`.
2. `evaCinemaToggled` emits `true`.

When toggled off:
1. `EvaApi.cinemaModeSubject` emits `false`.
2. `evaCinemaToggled` emits `false`.

The component's internal `isActive` signal stays in sync with `cinemaModeSubject`, so multiple toggles (button + settings panel item) driving the same player stay consistent.

### Usage

```html
<eva-player [class.cinema]="isCinema()" [evaVideoSources]="sources()">
  <eva-overlay-play />
  <eva-buffering />

  <eva-controls-container evaUserInteractionEvents [evaAutohide]="true">
    <eva-play-pause />
    <eva-cinema-mode (evaCinemaToggled)="isCinema.set($event)" />
    <eva-fullscreen />
  </eva-controls-container>
</eva-player>
```

```typescript
protected readonly isCinema = signal(false);
```

### Consumer CSS

The component emits a signal — what you do with it is up to you. A common pattern is binding a class on the player and styling via CSS:

```css
eva-player.cinema {
  width: 100%;
  max-width: 100%;
}
```

For a dimming backdrop, add your own element toggled by the same signal:

```html
@if (isCinema()) {
  <div class="backdrop" (click)="isCinema.set(false)"></div>
}
```

### Consumer Example

```typescript
import { Component, signal } from '@angular/core';
import { EvaCinemaMode, EvaPlayer, EvaControlsContainer, EvaPlayPause, EvaFullscreen } from 'ez-vid-ang';

@Component({
  selector: 'app-player',
  imports: [EvaPlayer, EvaControlsContainer, EvaPlayPause, EvaCinemaMode, EvaFullscreen],
  template: `
    <div class="layout" [class.cinema-active]="isCinema()">
      <eva-player [evaVideoSources]="sources()">
        <eva-controls-container evaUserInteractionEvents>
          <eva-play-pause />
          <eva-cinema-mode (evaCinemaToggled)="isCinema.set($event)" />
          <eva-fullscreen />
        </eva-controls-container>
      </eva-player>
      <aside>Sidebar</aside>
    </div>
  `,
  styles: `
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; }
    .layout.cinema-active { grid-template-columns: minmax(0, 1fr); }
  `
})
export class PlayerComponent {
  protected readonly sources = signal([{ src: 'video.mp4', type: 'video/mp4' }]);
  protected readonly isCinema = signal(false);
}
```

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

### `EvaCinemaModeAria`

| Property | Type | Default | Description |
|---|---|---|---|
| `ariaLabel` | `string` | `"Cinema mode"` | Static `aria-label` for the button. |
| `ariaValueText.active` | `string` | `"Cinema mode is on"` | `aria-valuetext` when active. |
| `ariaValueText.inactive` | `string` | `"Cinema mode is off"` | `aria-valuetext` when inactive. |

### Settings Panel Integration

Drive cinema mode from the settings panel via `EvaApi.cinemaModeSubject`. `<eva-cinema-mode>` stays in the controls bar and automatically syncs its `isActive` state from the subject:

```html
<eva-player [class.cinema]="isCinema()">
  <eva-controls-container>
    <eva-cinema-mode (evaCinemaToggled)="isCinema.set($event)" />
    <eva-settings-panel [evaSettingsMenuItems]="settingsItems()" (evaSettingsMenuItemSelected)="onSettingChanged($event)" />
  </eva-controls-container>
</eva-player>
```

```typescript
protected readonly isCinema = signal(false);

protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  { id: 'cinema', label: 'Cinema mode', currentValue: 'Off' },
]);

public ngAfterViewInit(): void {
  this.api.cinemaModeSubject.subscribe(active => {
    this.isCinema.set(active);
    this.settingsItems.update(items =>
      items.map(item =>
        item.id === 'cinema' ? { ...item, currentValue: active ? 'On' : 'Off' } : item,
      ),
    );
  });
}

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'cinema') {
    this.api.cinemaModeSubject.next(!this.isCinema());
  }
}
```
