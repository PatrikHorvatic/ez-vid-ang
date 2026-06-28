## EvaDownload

Download button component for the Eva video player. Emits an event with the current video source URL, playback time, and duration when clicked. The component does not perform any download logic — the consumer handles the emitted data.

### Selector

```html
<eva-download />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses built-in icon classes and uses projected content instead. |
| `evaAria` | `EvaDownloadAria` | No | `{ ariaLabel: "Download" }` | ARIA configuration for the button. |

### Outputs

| Output | Type | Description |
|---|---|---|
| `evaDownloadClicked` | `EvaDownloadEvent` | Emitted on click or keyboard activation (`Enter` / `Space`). |

### `EvaDownloadEvent`

| Property | Type | Description |
|---|---|---|
| `currentSrc` | `string` | The current video source URL (`HTMLVideoElement.currentSrc`). Empty string if not available. |
| `currentTime` | `number` | Playback position in seconds at the moment of the click. |
| `duration` | `number` | Total video duration in seconds. `Infinity` for live streams. |

### Usage

```html
<!-- Default icon -->
<eva-download (evaDownloadClicked)="onDownload($event)" />

<!-- Custom icon -->
<eva-download [evaCustomIcon]="true" (evaDownloadClicked)="onDownload($event)">
  <img src="assets/download.svg" alt="" />
</eva-download>

<!-- Custom ARIA label -->
<eva-download
  [evaAria]="{ ariaLabel: 'Save video' }"
  (evaDownloadClicked)="onDownload($event)"
/>

<!-- Inside a controls container -->
<eva-controls-container evaUserInteractionEvents [evaAutohide]="true">
  <eva-play-pause />
  <eva-controls-divider />
  <eva-download (evaDownloadClicked)="onDownload($event)" />
  <eva-fullscreen />
</eva-controls-container>
```

### Consumer Example

```typescript
import { Component } from '@angular/core';
import { EvaDownload, EvaDownloadEvent } from 'ez-vid-ang';

@Component({
  selector: 'app-player',
  imports: [EvaDownload],
  template: `<eva-download (evaDownloadClicked)="onDownload($event)" />`
})
export class PlayerComponent {
  onDownload(event: EvaDownloadEvent): void {
    // Option 1: Programmatic anchor download
    const a = document.createElement('a');
    a.href = event.currentSrc;
    a.download = '';
    a.click();

    // Option 2: Open in new tab
    window.open(event.currentSrc, '_blank');

    // Option 3: Send to backend
    fetch('/api/download', {
      method: 'POST',
      body: JSON.stringify({ src: event.currentSrc }),
    });
  }
}
```

### Accessibility

The component renders as `role="button"` with `tabindex="0"`. Keyboard activation via `Enter` or `Space` triggers the same output as a click.

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-control-element-height` | inherited | Height of the button. |
| `--eva-icon-color` | inherited | Color of the built-in icon. |

### `EvaDownloadAria`

| Property | Type | Default | Description |
|---|---|---|---|
| `ariaLabel` | `string` | `"Download"` | Static `aria-label` for the button element. |
