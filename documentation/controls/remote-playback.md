## EvaRemotePlayback

Remote playback (Cast/AirPlay) toggle button for the Eva video player. Uses the W3C Remote Playback API to show the browser's native device picker for ChromeCast (Chrome/Chromium) and falls back to `webkitShowPlaybackTargetPicker()` for AirPlay on Safari.

The button automatically hides when no remote playback devices are available or the API is not supported.

### Selector

```html
<eva-remote-playback />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead. |
| `evaAria` | `EvaRemotePlaybackAria` | No | See [`EvaRemotePlaybackAria`](#evaremoteplaybackaria) | ARIA labels for the button. |

### Icon Registry Keys

The built-in icon uses the `remote-playback` registry key. Register it before using the component:

```typescript
import { addEvaIcons } from 'ez-vid-ang';
import { evaRemotePlaybackIcon } from 'ez-vid-ang/icons';
addEvaIcons({ evaRemotePlaybackIcon });
```

### Outputs

| Output | Type | Description |
|---|---|---|
| `evaRemotePlaybackStateChanged` | `EvaRemotePlaybackState` | Emitted when the connection state changes. |

### `EvaRemotePlaybackState`

```typescript
type EvaRemotePlaybackState = 'disconnected' | 'connecting' | 'connected';
```

### Usage

```html
<!-- Minimal — auto-hides when no devices available -->
<eva-remote-playback />

<!-- With custom ARIA labels -->
<eva-remote-playback
  [evaAria]="{ ariaLabel: 'Cast to TV' }"
  (evaRemotePlaybackStateChanged)="onCastState($event)"
/>

<!-- Custom icon -->
<eva-remote-playback [evaCustomIcon]="true">
  <my-cast-icon />
</eva-remote-playback>

<!-- Inside a full controls bar -->
<eva-controls-container evaUserInteractionEvents [evaAutohide]="true">
  <eva-play-pause />
  <eva-controls-divider />
  <eva-remote-playback />
  <eva-fullscreen />
</eva-controls-container>
```

### Consumer Example

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  EvaControlsContainer,
  EvaFullscreen,
  EvaPlayPause,
  EvaPlayer,
  EvaRemotePlayback,
  EvaRemotePlaybackState,
} from 'ez-vid-ang';

@Component({
  selector: 'app-player',
  imports: [
    EvaPlayer,
    EvaControlsContainer,
    EvaPlayPause,
    EvaFullscreen,
    EvaRemotePlayback,
  ],
  template: `
    <eva-player #player id="player" [evaVideoSources]="sources()">
      <eva-controls-container>
        <eva-play-pause />
        <eva-remote-playback (evaRemotePlaybackStateChanged)="onCastState($event)" />
        <eva-fullscreen />
      </eva-controls-container>
    </eva-player>
    @if (castDevice()) {
      <p>Playing on {{ castDevice() }}</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerComponent {
  protected readonly sources = signal([{ src: 'video.mp4', type: 'video/mp4' }]);
  protected readonly castDevice = signal<string | null>(null);

  protected onCastState(state: EvaRemotePlaybackState): void {
    if (state === 'connected') {
      this.castDevice.set('Remote device');
    } else {
      this.castDevice.set(null);
    }
  }
}
```

### Behaviour

- **Auto-hide** — the button is hidden (`display: none`) when the Remote Playback API is not supported, no devices are available, or `disableRemotePlayback` is set on the video element.
- **Device availability** — monitored in real time via `remote.watchAvailability()`. The button appears/disappears as devices join or leave the network.
- **Click / Enter / Space** — opens the browser's native device picker (`remote.prompt()` on Chrome, `webkitShowPlaybackTargetPicker()` on Safari).
- **State tracking** — three states: `disconnected` → `connecting` → `connected` (and back). Updated via native events from the Remote Playback API.
- **Connecting animation** — the icon pulses with an opacity animation while connecting.
- **Connected indicator** — the icon color changes (default: blue) when connected.
- **Cleanup** — `watchAvailability` is cancelled and event listeners are removed on destroy.

### Browser Support

| Browser | API Used | Notes |
|---|---|---|
| Chrome / Chromium | Remote Playback API (`video.remote`) | Full support — ChromeCast devices |
| Safari (macOS/iOS) | `webkitShowPlaybackTargetPicker()` | AirPlay devices |
| Firefox | Not supported | Button auto-hides |

### EvaApi Integration

The component registers itself with `EvaApi`, making remote playback accessible from the settings panel, context menu, or any custom code:

| API member | Description |
|---|---|
| `EvaApi.promptRemotePlayback()` | Opens the device picker. No-op if `EvaRemotePlayback` is not in the template or no API is available. |
| `EvaApi.remotePlaybackStateSubject` | `BehaviorSubject<'disconnected' \| 'connecting' \| 'connected'>` — broadcasts the current connection state. |
| `EvaApi.registerRemotePlaybackPrompt(fn)` | Called by the component on init to register its prompt callback. |

### Host Classes

| Class | Applied when |
|---|---|
| `eva-remote-playback-hidden` | No devices available or API not supported |
| `eva-remote-playback-connecting` | Currently connecting to a device |
| `eva-remote-playback-connected` | Connected to a remote device |

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` / `Space` | Open device picker |

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-remote-playback-button-width` | `50px` | Width of the button. |
| `--eva-remote-playback-connected-color` | `rgb(59, 130, 246)` | Icon color when connected. |
| `--eva-control-element-height` | inherited | Height of the button. |
| `--eva-icon-color` | inherited | Color of the built-in cast icon. |

### `EvaRemotePlaybackAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Cast"` |
| `ariaValueText.disconnected` | `"Not connected"` |
| `ariaValueText.connecting` | `"Connecting…"` |
| `ariaValueText.connected` | `"Connected"` |

### Settings Panel Integration

You can add a Cast/AirPlay toggle to the `EvaSettingsPanel`. Subscribe to `EvaApi.remotePlaybackStateSubject` to keep the label in sync:

```typescript
private castSub: Subscription | null = null;

protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  { id: 'cast', label: 'Cast', currentValue: 'Off' },
]);

public ngOnInit(): void {
  this.castSub = this.api.remotePlaybackStateSubject.subscribe(state => {
    const label = state === 'connected' ? 'On' : state === 'connecting' ? 'Connecting…' : 'Off';
    this.settingsItems.update(items =>
      items.map(item =>
        item.id === 'cast'
          ? { ...item, currentValue: label }
          : item,
      ),
    );
  });
}

public ngOnDestroy(): void {
  this.castSub?.unsubscribe();
}

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'cast') {
    this.api.promptRemotePlayback();
  }
}
```
