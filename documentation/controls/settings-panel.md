## EvaSettingsPanel

YouTube-style settings panel component for the Eva video player. Renders a gear icon button in the control bar that opens a navigable dropdown menu. Items with sub-options navigate into a secondary view with a back button; items without sub-options emit a selection event directly.

The panel closes on outside click, `Escape`, or when focus leaves the component.

### Selector

```html
<eva-settings-panel />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaSettingsMenuItems` | `EvaSettingsMenuItem[]` | ✅ Yes | — | The list of items to display in the main menu. Items with `options` render a navigable sub-menu. |
| `evaSettingsPanelTitle` | `string` | No | `"Settings"` | Title displayed in the panel header. |
| `evaSettingsBackText` | `string` | No | `"Back"` | Text for the back button in sub-menus. |
| `evaAria` | `EvaSettingsPanelAria` | No | See [`EvaSettingsPanelAria`](#evasettingspanelaria) | ARIA label for the settings button. |
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses the registry-sourced gear icon and renders `<ng-content>` instead. |

### Icon Registry Keys

The built-in gear icon uses the `settings` registry key. Register it before using the component:

```typescript
import { addEvaIcons } from 'ez-vid-ang';
import { evaSettingsIcon } from 'ez-vid-ang/icons';
addEvaIcons({ evaSettingsIcon });
```

To use a custom icon instead:

```html
<eva-settings-panel [evaCustomIcon]="true" [evaSettingsMenuItems]="items()">
  <img src="assets/my-gear-icon.svg" alt="" />
</eva-settings-panel>
```

### Outputs

| Output | Type | Description |
|---|---|---|
| `evaSettingsMenuItemSelected` | `EvaSettingsMenuEvent` | Emitted when a menu option is selected (from sub-menu or a direct-action item). |

### `EvaSettingsMenuItem`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `string` | ✅ Yes | — | Unique identifier for this item. |
| `label` | `string` | ✅ Yes | — | Display label shown in the main menu. |
| `currentValue` | `string` | No | — | Current value displayed on the right side (e.g. `"1080p"`, `"Normal"`). |
| `options` | `EvaSettingsMenuOption[]` | No | — | Sub-menu options. When present, clicking the item navigates into the sub-menu. |
| `disabled` | `boolean` | No | `false` | Visible but not clickable. Styled with reduced opacity. |

### `EvaSettingsMenuOption`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `string` | ✅ Yes | — | Unique identifier emitted in `EvaSettingsMenuEvent`. |
| `label` | `string` | ✅ Yes | — | Display label shown in the sub-menu. |
| `selected` | `boolean` | No | `false` | Whether this option is currently selected. Shown with a checkmark. |

### `EvaSettingsMenuEvent`

| Property | Type | Description |
|---|---|---|
| `itemId` | `string` | The `id` of the parent menu item. |
| `optionId` | `string` | The `id` of the selected option, or the `itemId` if the item has no sub-menu. |
| `label` | `string` | The `label` of the selected option. |

### Usage

```html
<!-- Minimal — single settings item without sub-menu -->
<eva-settings-panel
  [evaSettingsMenuItems]="[
    { id: 'loop', label: 'Loop' }
  ]"
  (evaSettingsMenuItemSelected)="onSetting($event)"
/>

<!-- With sub-menus for speed and quality -->
<eva-settings-panel
  [evaSettingsMenuItems]="[
    { id: 'speed', label: 'Playback speed', currentValue: 'Normal', options: [
      { id: '0.5', label: '0.5x' },
      { id: '1', label: 'Normal', selected: true },
      { id: '1.5', label: '1.5x' },
      { id: '2', label: '2x' }
    ]},
    { id: 'quality', label: 'Quality', currentValue: 'Auto', options: [
      { id: 'auto', label: 'Auto', selected: true },
      { id: '1080', label: '1080p' },
      { id: '720', label: '720p' },
      { id: '480', label: '480p' }
    ]},
    { id: 'loop', label: 'Loop' },
    { id: 'stats', label: 'Stats for nerds', disabled: true }
  ]"
  (evaSettingsMenuItemSelected)="onSetting($event)"
/>

<!-- Inside a full controls bar -->
<eva-controls-container>
  <eva-play-pause />
  <eva-time-display evaTimeProperty="current" evaTimeFormating="mm:ss" />
  <eva-controls-divider />
  <eva-settings-panel
    [evaSettingsMenuItems]="settingsItems()"
    (evaSettingsMenuItemSelected)="onSetting($event)"
  />
  <eva-fullscreen />
</eva-controls-container>
```

### Consumer Example

```typescript
import { Component, signal } from '@angular/core';
import {
  EvaControlsContainer,
  EvaControlsDivider,
  EvaFullscreen,
  EvaPlayPause,
  EvaPlayer,
  EvaSettingsPanel,
  EvaSettingsMenuEvent,
  EvaSettingsMenuItem,
} from 'ez-vid-ang';

@Component({
  selector: 'app-player',
  imports: [
    EvaPlayer,
    EvaControlsContainer,
    EvaPlayPause,
    EvaControlsDivider,
    EvaSettingsPanel,
    EvaFullscreen,
  ],
  template: `
    <eva-player id="player" [evaVideoSources]="sources()">
      <eva-controls-container>
        <eva-play-pause />
        <eva-controls-divider />
        <eva-settings-panel
          [evaSettingsMenuItems]="settingsItems()"
          (evaSettingsMenuItemSelected)="onSettingChanged($event)"
        />
        <eva-fullscreen />
      </eva-controls-container>
    </eva-player>
  `,
})
export class PlayerComponent {
  protected readonly sources = signal([{ src: 'video.mp4', type: 'video/mp4' }]);

  protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
    {
      id: 'speed',
      label: 'Playback speed',
      currentValue: 'Normal',
      options: [
        { id: '0.5', label: '0.5x' },
        { id: '1', label: 'Normal', selected: true },
        { id: '1.5', label: '1.5x' },
        { id: '2', label: '2x' },
      ],
    },
    { id: 'loop', label: 'Loop' },
  ]);

  protected onSettingChanged(event: EvaSettingsMenuEvent): void {
    switch (event.itemId) {
      case 'speed':
        this.updateSubMenu('speed', event);
        break;
      case 'loop':
        console.log('Toggle loop');
        break;
    }
  }

  private updateSubMenu(itemId: string, event: EvaSettingsMenuEvent): void {
    this.settingsItems.update(items =>
      items.map(item =>
        item.id === itemId
          ? {
              ...item,
              currentValue: event.label,
              options: item.options?.map(opt => ({
                ...opt,
                selected: opt.id === event.optionId,
              })),
            }
          : item,
      ),
    );
  }
}
```

### Integration with EvaApi

The settings panel is stateless — it doesn't know about playback speed, quality, or any other player feature. To make it functional, the consumer wires the `evaSettingsMenuItemSelected` output to `EvaApi` methods. This section shows how to integrate each feature.

To access `EvaApi` from the consumer component, use `viewChild` to get the player reference and access its API:

```typescript
import { Component, signal, viewChild } from '@angular/core';
import { EvaPlayer, EvaApi } from 'ez-vid-ang';

@Component({ ... })
export class PlayerComponent {
  private readonly player = viewChild<EvaPlayer>('player');

  private get api(): EvaApi {
    return this.player()!.evaAPI;
  }
}
```

#### Playback Speed

Wire the speed sub-menu to `EvaApi.setPlaybackSpeed()`:

```typescript
protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  {
    id: 'speed',
    label: 'Playback speed',
    currentValue: 'Normal',
    options: [
      { id: '0.25', label: '0.25x' },
      { id: '0.5', label: '0.5x' },
      { id: '1', label: 'Normal', selected: true },
      { id: '1.5', label: '1.5x' },
      { id: '2', label: '2x' },
    ],
  },
]);

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'speed') {
    this.api.setPlaybackSpeed(Number(event.optionId));
    this.updateSubMenu('speed', event);
  }
}
```

#### Loop Toggle

Wire the loop item to `EvaApi.loopSubject` and the video element's `loop` property:

```typescript
protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  { id: 'loop', label: 'Loop', currentValue: 'Off' },
]);

private isLooping = false;

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

#### Cinema Mode

Wire to `EvaApi.cinemaModeSubject`. The `EvaCinemaMode` component subscribes to this subject, so toggling it here activates cinema mode automatically:

```typescript
protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  { id: 'cinema', label: 'Cinema mode', currentValue: 'Off' },
]);

private isCinemaMode = false;

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

#### Screenshot

Wire to `EvaApi.captureScreenshot()`. Since the method is async, handle the result via `.then()`:

```typescript
protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  { id: 'screenshot', label: 'Take screenshot' },
]);

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'screenshot') {
    this.api.captureScreenshot('image/png', 0.92).then(result => {
      if (result?.blob) {
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screenshot-${result.currentTime.toFixed(1)}s.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }
}
```

#### Picture-in-Picture

Wire to `EvaApi.changePictureInPictureStatus()` and subscribe to `EvaApi.pictureInPictureSubject` to keep the label in sync:

```typescript
import { Component, OnInit, OnDestroy, signal, viewChild } from '@angular/core';
import { Subscription } from 'rxjs';

export class PlayerComponent implements OnInit, OnDestroy {
  private pipSub: Subscription | null = null;
  private isPip = false;

  protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
    { id: 'pip', label: 'Picture-in-Picture', currentValue: 'Off' },
  ]);

  public ngOnInit(): void {
    this.pipSub = this.api.pictureInPictureSubject.subscribe(active => {
      this.isPip = active;
      this.settingsItems.update(items =>
        items.map(item =>
          item.id === 'pip'
            ? { ...item, currentValue: active ? 'On' : 'Off' }
            : item,
        ),
      );
    });
  }

  public ngOnDestroy(): void {
    this.pipSub?.unsubscribe();
  }

  protected onSettingChanged(event: EvaSettingsMenuEvent): void {
    if (event.itemId === 'pip') {
      this.api.changePictureInPictureStatus();
    }
  }
}
```

#### Quality Selector (HLS/DASH streams)

Subscribe to `EvaApi.qualityLevelsSubject` to dynamically populate the quality sub-menu when streaming levels become available:

```typescript
import { Component, OnInit, OnDestroy, signal, viewChild } from '@angular/core';
import { Subscription } from 'rxjs';

export class PlayerComponent implements OnInit, OnDestroy {
  private qualitySub: Subscription | null = null;

  protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([]);

  public ngOnInit(): void {
    this.qualitySub = this.api.qualityLevelsSubject.subscribe(levels => {
      if (!levels.length) { return; }

      const qualityItem: EvaSettingsMenuItem = {
        id: 'quality',
        label: 'Quality',
        currentValue: 'Auto',
        options: levels.map(level => ({
          id: String(level.qualityIndex),
          label: level.isAuto ? 'Auto' : level.label,
          selected: level.selected,
        })),
      };

      this.settingsItems.update(items => {
        const existing = items.findIndex(i => i.id === 'quality');
        if (existing !== -1) {
          const copy = [...items];
          copy[existing] = qualityItem;
          return copy;
        }
        return [...items, qualityItem];
      });
    });
  }

  public ngOnDestroy(): void {
    this.qualitySub?.unsubscribe();
  }

  protected onSettingChanged(event: EvaSettingsMenuEvent): void {
    if (event.itemId === 'quality') {
      this.api.setQuality(Number(event.optionId));
      this.updateSubMenu('quality', event);
    }
  }
}
```

#### Full Integration Example

Putting it all together — a single settings panel that consolidates playback speed, loop, cinema mode, screenshot, and PiP:

```typescript
import { Component, OnInit, OnDestroy, signal, viewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  EvaControlsContainer,
  EvaControlsDivider,
  EvaCinemaMode,
  EvaFullscreen,
  EvaPlayPause,
  EvaPlayer,
  EvaApi,
  EvaSettingsPanel,
  EvaSettingsMenuEvent,
  EvaSettingsMenuItem,
} from 'ez-vid-ang';

@Component({
  selector: 'app-player',
  imports: [
    EvaPlayer,
    EvaControlsContainer,
    EvaPlayPause,
    EvaControlsDivider,
    EvaSettingsPanel,
    EvaCinemaMode,
    EvaFullscreen,
  ],
  template: `
    <eva-player #player id="player" [evaVideoSources]="sources()">
      <eva-cinema-mode />
      <eva-controls-container>
        <eva-play-pause />
        <eva-controls-divider />
        <eva-settings-panel
          [evaSettingsMenuItems]="settingsItems()"
          (evaSettingsMenuItemSelected)="onSettingChanged($event)"
        />
        <eva-fullscreen />
      </eva-controls-container>
    </eva-player>
  `,
})
export class PlayerComponent implements OnInit, OnDestroy {
  private readonly player = viewChild<EvaPlayer>('player');
  private pipSub: Subscription | null = null;

  private get api(): EvaApi {
    return this.player()!.evaAPI;
  }

  protected readonly sources = signal([{ src: 'video.mp4', type: 'video/mp4' }]);

  private isLooping = false;
  private isCinemaMode = false;

  protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
    {
      id: 'speed',
      label: 'Playback speed',
      currentValue: 'Normal',
      options: [
        { id: '0.5', label: '0.5x' },
        { id: '1', label: 'Normal', selected: true },
        { id: '1.5', label: '1.5x' },
        { id: '2', label: '2x' },
      ],
    },
    { id: 'loop', label: 'Loop', currentValue: 'Off' },
    { id: 'cinema', label: 'Cinema mode', currentValue: 'Off' },
    { id: 'pip', label: 'Picture-in-Picture', currentValue: 'Off' },
    { id: 'screenshot', label: 'Take screenshot' },
  ]);

  public ngOnInit(): void {
    this.pipSub = this.api.pictureInPictureSubject.subscribe(active => {
      this.settingsItems.update(items =>
        items.map(item =>
          item.id === 'pip'
            ? { ...item, currentValue: active ? 'On' : 'Off' }
            : item,
        ),
      );
    });
  }

  public ngOnDestroy(): void {
    this.pipSub?.unsubscribe();
  }

  protected onSettingChanged(event: EvaSettingsMenuEvent): void {
    switch (event.itemId) {
      case 'speed':
        this.api.setPlaybackSpeed(Number(event.optionId));
        this.updateSubMenu('speed', event);
        break;

      case 'loop':
        this.isLooping = !this.isLooping;
        if (this.api.assignedVideoElement) {
          this.api.assignedVideoElement.loop = this.isLooping;
          this.api.loopSubject.next(this.isLooping);
        }
        this.updateToggle('loop', this.isLooping);
        break;

      case 'cinema':
        this.isCinemaMode = !this.isCinemaMode;
        this.api.cinemaModeSubject.next(this.isCinemaMode);
        this.updateToggle('cinema', this.isCinemaMode);
        break;

      case 'pip':
        this.api.changePictureInPictureStatus();
        break;

      case 'screenshot':
        this.api.captureScreenshot().then(result => {
          if (result?.blob) {
            const url = URL.createObjectURL(result.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `screenshot-${result.currentTime.toFixed(1)}s.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        });
        break;
    }
  }

  private updateSubMenu(itemId: string, event: EvaSettingsMenuEvent): void {
    this.settingsItems.update(items =>
      items.map(item =>
        item.id === itemId
          ? {
              ...item,
              currentValue: event.label,
              options: item.options?.map(opt => ({
                ...opt,
                selected: opt.id === event.optionId,
              })),
            }
          : item,
      ),
    );
  }

  private updateToggle(itemId: string, active: boolean): void {
    this.settingsItems.update(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, currentValue: active ? 'On' : 'Off' }
          : item,
      ),
    );
  }
}
```

### Behaviour

- **Click** on the gear icon toggles the panel open/closed.
- **Click outside** the panel closes it (with 50ms debounce to ignore the opening click).
- **Escape** in a sub-menu navigates back to the main menu; a second `Escape` closes the panel.
- **Blur** (focus leaving the component) closes the panel.
- **Main menu items** with `options` navigate into a sub-menu view.
- **Main menu items** without `options` emit `evaSettingsMenuItemSelected` directly and close the panel.
- **Sub-menu options** emit `evaSettingsMenuItemSelected` with both `itemId` and `optionId`, then navigate back to the main menu (the panel stays open so the user can change another setting).
- The gear icon **rotates 60°** when the panel is open.
- The panel appears **above** the button, anchored to the bottom-right, matching other dropdown positions in the player.
- The component notifies `EvaApi.controlsSelectorComponentActive` when opening/closing, preventing the controls container from auto-hiding while the panel is open.

### Menu Navigation Flow

```
┌─────────────────────┐
│  ⚙ Settings         │  ← Panel header
├─────────────────────┤
│  Playback speed  ▸  │  ← Click navigates to sub-menu
│        Normal       │
│  Quality         ▸  │
│        Auto         │
│  Loop               │  ← Click emits event directly
│  Stats for nerds    │  ← Disabled (greyed out)
└─────────────────────┘

         ↓ Click "Playback speed"

┌─────────────────────┐
│  ◂ Playback speed   │  ← Back button + sub-menu title
├─────────────────────┤
│     0.5x            │
│  ✓  Normal          │  ← Selected (checkmark)
│     1.5x            │
│     2x              │
└─────────────────────┘
```

### State Management

The component is **stateless** regarding the actual settings values. It renders whatever `evaSettingsMenuItems` provides and emits selection events. The consumer is responsible for:

1. Building the `EvaSettingsMenuItem[]` array with the correct `currentValue` and `selected` flags.
2. Handling the `EvaSettingsMenuEvent` output to apply the change (e.g. calling `EvaApi.setPlaybackSpeed()`).
3. Updating the `evaSettingsMenuItems` signal to reflect the new state.

This design keeps the settings panel fully generic — it can consolidate playback speed, quality, subtitles, loop, or any custom settings into a single gear button.

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` / `Space` | Open panel, or select the focused item |
| `ArrowDown` | Open panel, or focus the next item |
| `ArrowUp` | Open panel, or focus the previous item |
| `Home` | Focus the first item (when open) |
| `End` | Focus the last item (when open) |
| `Escape` | Back to main menu (in sub-menu) or close the panel |

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-settings-panel-button-width` | `44px` | Width of the gear icon button. |
| `--eva-settings-panel-icon-size` | `22px` | Size of the gear icon SVG. |
| `--eva-settings-panel-icon-color` | `white` | Color of the gear icon. |
| `--eva-settings-panel-hover-background` | `rgba(255, 255, 255, 0.1)` | Background of the button on hover. |
| `--eva-settings-panel-open-background` | `rgba(255, 255, 255, 0.15)` | Background of the button when the panel is open. |
| `--eva-settings-panel-background` | `rgba(0, 0, 0, 0.92)` | Background of the dropdown panel. |
| `--eva-settings-panel-border-radius` | `8px` | Border radius of the dropdown panel. |
| `--eva-settings-panel-box-shadow` | `0 8px 32px rgba(0, 0, 0, 0.5), ...` | Box shadow of the dropdown panel. |
| `--eva-settings-panel-min-width` | `220px` | Minimum width of the dropdown. |
| `--eva-settings-panel-min-width-mobile` | `180px` | Minimum width on screens ≤ 480px. |
| `--eva-settings-panel-max-height` | `280px` | Maximum height of the items/options list (scrollable). |
| `--eva-settings-panel-header-padding` | `10px 14px 8px` | Padding of the panel header. |
| `--eva-settings-panel-header-font-size` | `12px` | Font size of the header title. |
| `--eva-settings-panel-header-color` | `rgba(255, 255, 255, 0.6)` | Color of the header title. |
| `--eva-settings-panel-header-border` | `1px solid rgba(255, 255, 255, 0.1)` | Bottom border of the header. |
| `--eva-settings-panel-back-color` | `rgba(255, 255, 255, 0.7)` | Color of the back button arrow. |
| `--eva-settings-panel-item-padding` | `10px 14px` | Padding of each main menu item. |
| `--eva-settings-panel-item-font-size` | `14px` | Font size of main menu item labels. |
| `--eva-settings-panel-item-color` | `rgba(255, 255, 255, 0.95)` | Color of main menu item labels. |
| `--eva-settings-panel-item-hover-background` | `rgba(255, 255, 255, 0.1)` | Background on hover/focus. |
| `--eva-settings-panel-item-value-font-size` | `13px` | Font size of the current value text. |
| `--eva-settings-panel-item-value-color` | `rgba(255, 255, 255, 0.5)` | Color of the current value text. |
| `--eva-settings-panel-item-arrow-color` | `rgba(255, 255, 255, 0.4)` | Color of the right arrow icon. |
| `--eva-settings-panel-option-padding` | `10px 14px` | Padding of each sub-menu option. |
| `--eva-settings-panel-option-font-size` | `14px` | Font size of sub-menu option labels. |
| `--eva-settings-panel-option-color` | `rgba(255, 255, 255, 0.95)` | Color of sub-menu option labels. |
| `--eva-settings-panel-option-hover-background` | `rgba(255, 255, 255, 0.1)` | Background on hover/focus. |
| `--eva-settings-panel-option-selected-background` | `rgba(59, 130, 246, 0.2)` | Background of the selected option. |
| `--eva-settings-panel-option-check-size` | `16px` | Size of the checkmark icon. |
| `--eva-settings-panel-option-check-color` | `rgba(59, 130, 246, 1)` | Color of the checkmark icon. |

### `EvaSettingsPanelAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Settings"` |
