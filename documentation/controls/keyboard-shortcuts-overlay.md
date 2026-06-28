## EvaKeyboardShortcutsOverlay

Centered overlay panel that displays all configured keyboard shortcuts, grouped by category (Playback, Seeking, Media). Integrated with the `EvaKeyboardShortcuts` directive — the overlay is toggled automatically when the user presses `?` and reads its configuration directly from `EvaApi`.

The component is fully standalone and tree-shakable. It is only included in the bundle when imported and placed in the template.

### Selector

```html
<eva-keyboard-shortcuts-overlay />
```

### Prerequisites

Keyboard shortcuts must be enabled on the player for the overlay to function:

```html
<eva-player [evaKeyboardShortcutsEnabled]="true">
  ...
</eva-player>
```

The `EvaKeyboardShortcuts` directive:
1. Publishes the resolved configuration to `EvaApi.keyboardShortcutsConfigSubject`.
2. Handles the `?` key press and toggles `EvaApi.keyboardShortcutsOverlaySubject`.

The overlay subscribes to both subjects — no manual wiring is required.

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaShortcutsOverlayTitle` | `string` | No | `"Keyboard shortcuts"` | Title displayed at the top of the overlay. |

### Usage

```html
<!-- Minimal — just drop it in the player -->
<eva-player
  id="my-player"
  [evaVideoSources]="sources()"
  [evaKeyboardShortcutsEnabled]="true"
>
  <eva-keyboard-shortcuts-overlay />
  <eva-controls-container>
    <eva-play-pause />
    <eva-fullscreen />
  </eva-controls-container>
</eva-player>
```

```html
<!-- With custom title -->
<eva-keyboard-shortcuts-overlay evaShortcutsOverlayTitle="Hotkeys" />
```

```html
<!-- With custom keyboard configuration — the overlay reflects whatever config is set -->
<eva-player
  [evaKeyboardShortcutsEnabled]="true"
  [evaKeyboardShortcutsConfiguration]="{
    backwardsKeyOne: 'ArrowLeft',
    forwardKeyOne: 'ArrowRight',
    backwardSeconds: 5,
    forwardSeconds: 5,
    muteKey: 'M',
    fullscreen: 'F',
    playPause: 'Space'
  }"
>
  <eva-keyboard-shortcuts-overlay />
  <eva-controls-container>...</eva-controls-container>
</eva-player>
```

### Consumer Example

```typescript
import { Component, signal } from '@angular/core';
import {
  EvaControlsContainer,
  EvaFullscreen,
  EvaKeyboardShortcutsOverlay,
  EvaPlayPause,
  EvaPlayer,
} from 'ez-vid-ang';

@Component({
  selector: 'app-player',
  imports: [
    EvaPlayer,
    EvaControlsContainer,
    EvaPlayPause,
    EvaFullscreen,
    EvaKeyboardShortcutsOverlay,
  ],
  template: `
    <eva-player
      #player
      id="player"
      [evaVideoSources]="sources()"
      [evaKeyboardShortcutsEnabled]="true"
    >
      <eva-keyboard-shortcuts-overlay />
      <eva-controls-container>
        <eva-play-pause />
        <eva-fullscreen />
      </eva-controls-container>
    </eva-player>
  `,
})
export class PlayerComponent {
  protected readonly sources = signal([{ src: 'video.mp4', type: 'video/mp4' }]);
}
```

That's it. No outputs, no state management, no event handlers. Press `?` to open, press `?` or `Escape` to close.

### Integration with Settings Panel

The overlay can also be opened from the settings panel by toggling the subject on `EvaApi`:

```typescript
protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'shortcuts') {
    this.api.keyboardShortcutsOverlaySubject.next(true);
    this.api.controlsSelectorComponentActive.next(true);
  }
}
```

### Behaviour

- **`?` key** toggles the overlay open/closed (handled by the `EvaKeyboardShortcuts` directive, not the overlay itself).
- **`Escape` key** closes the overlay when open.
- **Click outside** the panel closes the overlay (with 50ms debounce to ignore the opening click).
- **Close button** (×) in the header closes the overlay.
- The overlay reads the keyboard configuration from `EvaApi.keyboardShortcutsConfigSubject`. If no configuration has been published (e.g. keyboard shortcuts are not enabled), the shortcut list is empty.
- The overlay notifies `EvaApi.controlsSelectorComponentActive` to prevent the controls container from auto-hiding while the overlay is visible.
- Key labels are automatically formatted for display: `ARROWLEFT` → `←`, `ARROWRIGHT` → `→`, `SPACE` → `Space`.

### Overlay Layout

```
┌─────────────────────────────────────┐
│  Keyboard shortcuts             ✕   │
├─────────────────────────────────────┤
│  PLAYBACK                           │
│  Play / Pause              [Space]  │
│                                     │
│  SEEKING                            │
│  Seek backward 10s      [J] / [←]  │
│  Seek forward 10s       [L] / [→]  │
│  Previous frame                [,]  │
│  Next frame                    [.]  │
│  Jump to 0%–90%        [0] – [9]   │
│                                     │
│  MEDIA                              │
│  Mute / Unmute                 [M]  │
│  Toggle fullscreen             [F]  │
│  Show / hide shortcuts         [?]  │
└─────────────────────────────────────┘
```

### EvaApi Integration

The overlay is driven by two subjects on `EvaApi`:

| Subject | Type | Description |
|---|---|---|
| `keyboardShortcutsOverlaySubject` | `BehaviorSubject<boolean>` | Open/close state. Toggled by the keyboard shortcuts directive on `?` key press. Can also be toggled programmatically. |
| `keyboardShortcutsConfigSubject` | `BehaviorSubject<Required<EvaKeyboardShortcutsConfiguration> \| null>` | The resolved keyboard configuration. Published by the keyboard shortcuts directive on init. |

### Keyboard Support

| Key | Action |
|---|---|
| `?` | Toggle overlay (handled by `EvaKeyboardShortcuts` directive) |
| `Escape` | Close overlay |

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-shortcuts-overlay-background` | `rgba(0, 0, 0, 0.92)` | Background of the overlay panel. |
| `--eva-shortcuts-overlay-border-radius` | `12px` | Border radius of the panel. |
| `--eva-shortcuts-overlay-box-shadow` | `0 8px 32px rgba(0, 0, 0, 0.5), ...` | Box shadow of the panel. |
| `--eva-shortcuts-overlay-width` | `360px` | Width of the panel. |
| `--eva-shortcuts-overlay-header-padding` | `16px 20px 12px` | Padding of the header. |
| `--eva-shortcuts-overlay-header-border` | `1px solid rgba(255, 255, 255, 0.1)` | Bottom border of the header. |
| `--eva-shortcuts-overlay-title-font-size` | `15px` | Font size of the title. |
| `--eva-shortcuts-overlay-title-color` | `rgba(255, 255, 255, 0.95)` | Color of the title. |
| `--eva-shortcuts-overlay-close-color` | `rgba(255, 255, 255, 0.6)` | Color of the close button. |
| `--eva-shortcuts-overlay-body-padding` | `8px 20px 16px` | Padding of the body content. |
| `--eva-shortcuts-overlay-group-title-font-size` | `11px` | Font size of group headings. |
| `--eva-shortcuts-overlay-group-title-color` | `rgba(255, 255, 255, 0.4)` | Color of group headings. |
| `--eva-shortcuts-overlay-row-padding` | `6px 0` | Padding of each shortcut row. |
| `--eva-shortcuts-overlay-description-font-size` | `13px` | Font size of shortcut descriptions. |
| `--eva-shortcuts-overlay-description-color` | `rgba(255, 255, 255, 0.8)` | Color of shortcut descriptions. |
| `--eva-shortcuts-overlay-key-min-width` | `28px` | Minimum width of a key badge. |
| `--eva-shortcuts-overlay-key-height` | `26px` | Height of a key badge. |
| `--eva-shortcuts-overlay-key-background` | `rgba(255, 255, 255, 0.1)` | Background of key badges. |
| `--eva-shortcuts-overlay-key-border` | `1px solid rgba(255, 255, 255, 0.15)` | Border of key badges. |
| `--eva-shortcuts-overlay-key-font-size` | `12px` | Font size inside key badges. |
| `--eva-shortcuts-overlay-key-color` | `rgba(255, 255, 255, 0.9)` | Text color of key badges. |
