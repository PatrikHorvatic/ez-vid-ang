## EvaContextMenu

Custom context menu component for the Eva video player. Replaces the browser's default right-click menu on the player with a branded dropdown. Menu items are provided via an input array — the consumer handles all actions via the emitted event.

The menu appears above all other player UI (including the overlay play button) and works regardless of video playback state.

### Selector

```html
<eva-context-menu />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaMenuItems` | `EvaContextMenuItem[]` | ✅ Yes | — | The list of menu items to display. |

### Outputs

| Output | Type | Description |
|---|---|---|
| `evaMenuItemClicked` | `EvaContextMenuEvent` | Emitted when a non-disabled, non-divider item is clicked or activated via keyboard. |

### `EvaContextMenuItem`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `string` | ✅ Yes | — | Unique identifier emitted when the item is clicked. |
| `label` | `string` | ✅ Yes | — | Display text shown in the menu. |
| `divider` | `boolean` | No | `false` | Renders as a visual separator line instead of an actionable item. |
| `disabled` | `boolean` | No | `false` | Visible but not clickable. Styled with reduced opacity. |

### `EvaContextMenuEvent`

| Property | Type | Description |
|---|---|---|
| `itemId` | `string` | The `id` of the clicked menu item. |
| `label` | `string` | The `label` of the clicked menu item. |
| `currentSrc` | `string` | The current video source URL at the time of the click. |
| `currentTime` | `number` | The current playback time in seconds. |

### Usage

```html
<!-- Basic context menu -->
<eva-player id="my-player" [evaVideoSources]="sources()">
  <eva-context-menu
    [evaMenuItems]="[
      { id: 'copy-url', label: 'Copy video URL' },
      { id: 'copy-time', label: 'Copy URL at current time' },
      { id: 'sep1', label: '', divider: true },
      { id: 'loop', label: 'Loop' },
      { id: 'stats', label: 'Stats for nerds', disabled: true }
    ]"
    (evaMenuItemClicked)="onMenuAction($event)"
  />
</eva-player>
```

### Consumer Example

```typescript
import { Component, signal } from '@angular/core';
import { EvaContextMenu, EvaContextMenuEvent, EvaContextMenuItem, EvaPlayer } from 'ez-vid-ang';

@Component({
  selector: 'app-player',
  imports: [EvaPlayer, EvaContextMenu],
  template: `
    <eva-player id="player" [evaVideoSources]="sources()">
      <eva-context-menu
        [evaMenuItems]="menuItems"
        (evaMenuItemClicked)="onMenuAction($event)"
      />
    </eva-player>
  `
})
export class PlayerComponent {
  protected readonly sources = signal([{ src: 'video.mp4', type: 'video/mp4' }]);

  protected readonly menuItems: EvaContextMenuItem[] = [
    { id: 'copy-url', label: 'Copy video URL' },
    { id: 'sep', label: '', divider: true },
    { id: 'about', label: 'About EzVidAng' },
  ];

  protected onMenuAction(event: EvaContextMenuEvent): void {
    switch (event.itemId) {
      case 'copy-url':
        navigator.clipboard.writeText(event.currentSrc);
        break;
      case 'about':
        window.open('https://github.com/PatrikHorvatic/ez-vid-ang', '_blank');
        break;
    }
  }
}
```

### Behaviour

- **Right-click** on the player area opens the menu at the cursor position.
- **Second right-click** while the menu is open closes it.
- **Click outside** the menu closes it.
- **Escape** key closes the menu.
- **ArrowUp / ArrowDown** navigates between actionable items (dividers and disabled items are skipped).
- **Enter / Space** activates the focused item.
- The menu is positioned absolutely within `eva-player` and **clamped** to the player boundaries — it never overflows outside the video player, even when right-clicking near edges.
- The menu element stays in the DOM and is shown/hidden via a CSS class (`eva-context-menu-open`), enabling smooth **scale and opacity transitions** on open and close.

### Animation

The menu opens with a `scale(0.95) → scale(1)` transition paired with an opacity fade-in, using `cubic-bezier(0.4, 0, 0.2, 1)` easing. The transition duration is controlled by `--eva-transition-duration` (default `0.25s`), matching the chapter list animation.

### Position Clamping

The menu is initially positioned at the cursor location relative to the player. After the first animation frame, the component measures the menu's actual dimensions (using `offsetWidth`/`offsetHeight`, which are unaffected by the CSS `scale()` transform) and shifts it inward if it would overflow the player's width or height.

### Parent Validation

The component must be placed inside `<eva-player>`. On init, it resolves the parent player element via `closest('eva-player')` and caches the reference. If no parent player is found, a warning is logged and right-click events are ignored.

### Keyboard Support

| Key | Action |
|---|---|
| `ArrowDown` | Focus next actionable item (wraps to first) |
| `ArrowUp` | Focus previous actionable item (wraps to last) |
| `Enter` / `Space` | Select the focused item |
| `Escape` | Close the menu |

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-context-menu-min-width` | `180px` | Minimum width of the menu. |
| `--eva-context-menu-max-width` | `300px` | Maximum width of the menu. |
| `--eva-context-menu-padding` | `4px 0` | Padding around the menu items. |
| `--eva-context-menu-background` | `rgba(20, 20, 20, 0.95)` | Background color of the menu. |
| `--eva-context-menu-border-radius` | `8px` | Border radius of the menu. |
| `--eva-context-menu-box-shadow` | `0 4px 16px rgba(0, 0, 0, 0.5), ...` | Box shadow of the menu. |
| `--eva-context-menu-font-size` | `13px` | Font size of menu items. |
| `--eva-context-menu-color` | `rgba(255, 255, 255, 0.9)` | Text color of menu items. |
| `--eva-context-menu-item-padding` | `8px 16px` | Padding of each menu item. |
| `--eva-context-menu-item-hover-background` | `rgba(255, 255, 255, 0.1)` | Background on hover/focus. |
| `--eva-context-menu-item-disabled-color` | `rgba(255, 255, 255, 0.35)` | Text color for disabled items. |
| `--eva-context-menu-divider-margin` | `4px 0` | Vertical margin around dividers. |
| `--eva-context-menu-divider-color` | `rgba(255, 255, 255, 0.12)` | Color of the divider line. |
