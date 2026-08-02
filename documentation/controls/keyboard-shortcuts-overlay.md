## EvaKeyboardShortcutsOverlay

Centered overlay panel that displays only the keyboard shortcuts you've actually bound, grouped by category (Playback, Seeking, Media, Tracks & quality). A group — and each row within it — is omitted entirely when its key is unset, since [`EvaKeyboardShortcutsConfiguration`](../core/player.md#evakeyboardshortcutsconfiguration) has no default bindings. Integrated with the `EvaKeyboardShortcuts` directive — the overlay is toggled automatically when the user presses `?` and reads its configuration directly from `EvaApi`.

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
| `evaShortcutsOverlayLabels` | `EvaKeyboardShortcutsOverlayLabels` | No | English defaults | Localizable group headings and per-shortcut descriptions. See [Localization](#localization). |

### Localization

Every group heading and shortcut description is plain visible text, not hardcoded — pass `evaShortcutsOverlayLabels` to translate the overlay into any language. All properties are optional; anything you don't override keeps its English default.

Simple string overrides can be inlined directly in the template:

```html
<eva-keyboard-shortcuts-overlay
  [evaShortcutsOverlayLabels]="{
    groupPlayback: 'Reprodukcija',
    groupSeeking: 'Premotavanje',
    groupMedia: 'Mediji',
    groupTracksAndQuality: 'Zapisi i kvaliteta',
    playPause: 'Pokreni / Pauziraj',
    muteUnmute: 'Utišaj / Uključi zvuk',
    toggleFullscreen: 'Cijeli zaslon'
  }"
/>
```

`seekBackward`/`seekForward` are functions, not plain strings, since their text embeds the configured seek amount — define the object as a component property (template expressions can't declare arrow functions inline):

```ts
protected readonly shortcutLabels: EvaKeyboardShortcutsOverlayLabels = {
  seekBackward: (seconds) => `${seconds}s unazad`,
  seekForward: (seconds) => `${seconds}s naprijed`,
};
```

```html
<eva-keyboard-shortcuts-overlay [evaShortcutsOverlayLabels]="shortcutLabels" />
```

See [`EvaKeyboardShortcutsOverlayLabels`](#evakeyboardshortcutsoverlaylabels) below for the full list of overridable properties.

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
<!-- The overlay reflects exactly the keys you bind — nothing more -->
<eva-player
  [evaKeyboardShortcutsEnabled]="true"
  [evaKeyboardShortcutsConfiguration]="{
    backwardsKeyOne: 'ArrowLeft',
    forwardKeyOne: 'ArrowRight',
    backwardSeconds: 5,
    forwardSeconds: 5,
    muteKey: 'M',
    fullscreen: 'F',
    playPause: 'Space',
    screenshotKey: 's'
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
- The overlay reads the keyboard configuration from `EvaApi.keyboardShortcutsConfigSubject`. If no configuration has been published (e.g. keyboard shortcuts are not enabled), the shortcut list is empty. Since no key has a default binding, any property left unset in `evaKeyboardShortcutsConfiguration` is also omitted from the list — a whole group (e.g. "Tracks & quality") disappears entirely if none of its keys are bound.
- The overlay notifies `EvaApi.controlsSelectorComponentActive` to prevent the controls container from auto-hiding while the overlay is visible.
- Key labels are automatically formatted for display: `ARROWLEFT` → `←`, `ARROWRIGHT` → `→`, `SPACE` → `Space`.

### Overlay Layout

For the example config above (`backwardsKeyOne`/`forwardKeyOne`, `muteKey`, `fullscreen`, `playPause`, `screenshotKey` — no track/quality/speed/chapter keys bound):

```
┌─────────────────────────────────────┐
│  Keyboard shortcuts             ✕   │
├─────────────────────────────────────┤
│  PLAYBACK                           │
│  Play / Pause              [Space]  │
│                                     │
│  SEEKING                            │
│  Seek backward 5s              [←]  │
│  Seek forward 5s               [→]  │
│  Jump to 0%–90%        [0] – [9]   │
│                                     │
│  MEDIA                              │
│  Mute / Unmute                 [M]  │
│  Toggle fullscreen             [F]  │
│  Capture screenshot            [S]  │
│  Show / hide shortcuts         [?]  │
└─────────────────────────────────────┘
```

Only bound keys render — no "Tracks & quality" group appears here since no `nextQualityKey`/`nextAudioTrackKey`/`nextSubtitleTrackKey` were set. Binding `pictureInPictureKey`, `cinemaModeKey`, `loopKey`, `downloadKey`, `remotePlaybackKey`, `retryKey`, `nextChapterKey`/`previousChapterKey`, `increasePlaybackSpeedKey`/`decreasePlaybackSpeedKey`, or any of the track/quality cycling keys adds a corresponding row automatically — see the full action table in [`EvaKeyboardShortcutsConfiguration`](../core/player.md#default-keyboard-shortcuts).

### `EvaKeyboardShortcutsOverlayLabels`

All properties are optional; each falls back independently to its English default below. `seekBackward`/`seekForward` are `(seconds: number) => string` functions — every other property is a plain `string`.

| Property | Default |
|---|---|
| `groupPlayback` | `"Playback"` |
| `groupSeeking` | `"Seeking"` |
| `groupMedia` | `"Media"` |
| `groupTracksAndQuality` | `"Tracks & quality"` |
| `playPause` | `"Play / Pause"` |
| `increasePlaybackSpeed` | `"Increase playback speed"` |
| `decreasePlaybackSpeed` | `"Decrease playback speed"` |
| `seekBackward(seconds)` | `` `Seek backward ${seconds}s` `` |
| `seekForward(seconds)` | `` `Seek forward ${seconds}s` `` |
| `previousFrame` | `"Previous frame"` |
| `nextFrame` | `"Next frame"` |
| `nextChapter` | `"Next chapter"` |
| `previousChapter` | `"Previous chapter"` |
| `jumpToPercentage` | `"Jump to 0%–90%"` |
| `muteUnmute` | `"Mute / Unmute"` |
| `increaseVolume` | `"Increase volume by 5%"` |
| `decreaseVolume` | `"Decrease volume by 5%"` |
| `toggleFullscreen` | `"Toggle fullscreen"` |
| `togglePictureInPicture` | `"Toggle Picture-in-Picture"` |
| `toggleCinemaMode` | `"Toggle cinema mode"` |
| `toggleLoop` | `"Toggle loop"` |
| `captureScreenshot` | `"Capture screenshot"` |
| `downloadVideo` | `"Download video"` |
| `castAirplay` | `"Cast / AirPlay"` |
| `retryAfterError` | `"Retry after error"` |
| `showHideShortcuts` | `"Show / hide shortcuts"` |
| `nextQuality` | `"Next quality level"` |
| `previousQuality` | `"Previous quality level"` |
| `nextAudioTrack` | `"Next audio track"` |
| `previousAudioTrack` | `"Previous audio track"` |
| `nextSubtitleTrack` | `"Next subtitle track"` |
| `previousSubtitleTrack` | `"Previous subtitle track"` |

Transformed via `transformEvaKeyboardShortcutsOverlayLabels`, following the same partial-input/fully-resolved pattern as every other `EvaXAria` type in the library (see `documentation/core/directives.md`'s tooltip section for an analogous example).

### EvaApi Integration

The overlay is driven by two subjects on `EvaApi`:

| Subject | Type | Description |
|---|---|---|
| `keyboardShortcutsOverlaySubject` | `BehaviorSubject<boolean>` | Open/close state. Toggled by the keyboard shortcuts directive on `?` key press. Can also be toggled programmatically. |
| `keyboardShortcutsConfigSubject` | `BehaviorSubject<EvaKeyboardShortcutsConfigurationTransformed \| null>` | The resolved keyboard configuration. Published by the keyboard shortcuts directive on init. Unbound shortcuts are `undefined`, never a fallback key. |

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
