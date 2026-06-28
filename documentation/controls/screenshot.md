## EvaScreenshot

Screenshot button component for the Eva video player. Delegates to `EvaApi.captureScreenshot()` and emits the result. The consumer handles the captured data (download, copy to clipboard, upload, etc.).

The capture logic lives in `EvaApi.captureScreenshot()`, so it can also be called programmatically without this component — for example, from a context menu action or a custom button.

### Selector

```html
<eva-screenshot />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, hides the built-in SVG icon and uses projected content. |
| `evaImageFormat` | `string` | No | `"image/png"` | MIME type for the captured image. Supports any format accepted by `canvas.toDataURL()`. |
| `evaImageQuality` | `number` | No | `0.92` | Quality for lossy formats (`image/jpeg`, `image/webp`). Value between `0` and `1`. Ignored for `image/png`. |
| `evaAria` | `EvaScreenshotAria` | No | `{ ariaLabel: "Screenshot" }` | ARIA configuration for the button. |

### Outputs

| Output | Type | Description |
|---|---|---|
| `evaScreenshotCaptured` | `EvaScreenshotEvent` | Emitted after capture attempt. Contains the frame data or `null` on failure. |

### `EvaScreenshotEvent`

| Property | Type | Description |
|---|---|---|
| `blob` | `Blob \| null` | The captured frame as a Blob. `null` if the canvas was tainted (cross-origin). |
| `dataUrl` | `string \| null` | The captured frame as a base64 data URL. `null` if tainted. |
| `currentTime` | `number` | Playback time in seconds when the frame was captured. |
| `width` | `number` | Natural width of the captured frame in pixels. |
| `height` | `number` | Natural height of the captured frame in pixels. |

### Usage

```html
<!-- Default icon -->
<eva-screenshot (evaScreenshotCaptured)="onScreenshot($event)" />

<!-- Custom icon -->
<eva-screenshot [evaCustomIcon]="true" (evaScreenshotCaptured)="onScreenshot($event)">
  <img src="assets/camera.svg" alt="" />
</eva-screenshot>

<!-- JPEG format with lower quality -->
<eva-screenshot
  evaImageFormat="image/jpeg"
  [evaImageQuality]="0.8"
  (evaScreenshotCaptured)="onScreenshot($event)"
/>

<!-- Inside a controls container -->
<eva-controls-container evaUserInteractionEvents [evaAutohide]="true">
  <eva-play-pause />
  <eva-controls-divider />
  <eva-screenshot (evaScreenshotCaptured)="onScreenshot($event)" />
  <eva-fullscreen />
</eva-controls-container>
```

### Consumer Examples

```typescript
import { Component } from '@angular/core';
import { EvaScreenshot, EvaScreenshotEvent } from 'ez-vid-ang';

@Component({
  selector: 'app-player',
  imports: [EvaScreenshot],
  template: `<eva-screenshot (evaScreenshotCaptured)="onScreenshot($event)" />`
})
export class PlayerComponent {

  onScreenshot(event: EvaScreenshotEvent): void {
    if (!event.dataUrl) {
      console.warn('Screenshot failed — video may be cross-origin.');
      return;
    }

    // Option 1: Download as file
    const a = document.createElement('a');
    a.href = event.dataUrl;
    a.download = `frame-${event.currentTime.toFixed(1)}s.png`;
    a.click();

    // Option 2: Copy to clipboard
    if (event.blob) {
      navigator.clipboard.write([
        new ClipboardItem({ [event.blob.type]: event.blob })
      ]);
    }

    // Option 3: Upload to server
    if (event.blob) {
      const form = new FormData();
      form.append('screenshot', event.blob, 'screenshot.png');
      fetch('/api/upload', { method: 'POST', body: form });
    }
  }
}
```

### Programmatic Usage (via EvaApi)

The capture logic can be called directly without using the `EvaScreenshot` component — useful for context menu actions or custom UI.

```typescript
// Example: context menu "Take Screenshot" action
async onMenuAction(event: EvaContextMenuEvent): Promise<void> {
  if (event.itemId === 'screenshot') {
    const result = await this.playerApi.captureScreenshot();
    if (result?.dataUrl) {
      const a = document.createElement('a');
      a.href = result.dataUrl;
      a.download = `frame-${result.currentTime.toFixed(1)}s.png`;
      a.click();
    }
  }
}
```

### Cross-Origin Handling

When the video source is cross-origin and the `<video>` element does not have `crossorigin="anonymous"`, the canvas becomes **tainted** after `drawImage()`. In this case:

- `toDataURL()` throws a `SecurityError` — caught internally, `dataUrl` is emitted as `null`.
- `toBlob()` returns `null` — emitted as-is.

To enable screenshots for cross-origin videos, set `crossorigin` in the video configuration:

```html
<eva-player
  id="my-player"
  [evaVideoSources]="sources()"
  [evaVideoConfiguration]="{ crossorigin: 'anonymous' }"
>
  <eva-screenshot (evaScreenshotCaptured)="onScreenshot($event)" />
</eva-player>
```

The server must also respond with the appropriate CORS headers (`Access-Control-Allow-Origin`).

### Accessibility

The component renders as `role="button"` with `tabindex="0"`. Keyboard activation via `Enter` or `Space` triggers the capture.

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-control-element-height` | inherited | Height of the button. |
| `--eva-icon-color` | inherited | Color of the built-in camera icon. |

### `EvaScreenshotAria`

| Property | Type | Default | Description |
|---|---|---|---|
| `ariaLabel` | `string` | `"Screenshot"` | Static `aria-label` for the button element. |
