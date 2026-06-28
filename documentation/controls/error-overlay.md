## EvaErrorOverlay

Error overlay component for the Eva video player. Displays a user-facing error message with a retry button when the video enters the `ERROR` state. Covers the full video area and sits above the overlay play button.

The overlay appears automatically when `EvaApi.videoStateSubject` emits `EvaState.ERROR` and hides when the state changes (e.g. after a successful retry).

### Selector

```html
<eva-error-overlay />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaErrorText` | `string` | No | `"An error occurred during video playback."` | Error message displayed to the user. |
| `evaRetryText` | `string` | No | `"Retry"` | Label on the retry button. |
| `evaCustomContent` | `boolean` | No | `false` | When `true`, replaces the built-in UI with projected content. |
| `evaAria` | `EvaErrorOverlayAria` | No | See below | ARIA labels for the overlay and retry button. |

### Outputs

| Output | Type | Description |
|---|---|---|
| `evaRetryClicked` | `void` | Emitted when the retry button is clicked. The component also calls `videoElement.load()` to reload the current source. |

### Usage

```html
<!-- Default error overlay -->
<eva-player id="my-player" [evaVideoSources]="sources()">
  <eva-error-overlay />
  <eva-overlay-play />
  <eva-controls-container>
    <eva-play-pause />
  </eva-controls-container>
</eva-player>

<!-- Custom error message and retry label -->
<eva-error-overlay
  evaErrorText="Oops! Something went wrong."
  evaRetryText="Try Again"
/>

<!-- Custom ARIA labels -->
<eva-error-overlay
  [evaAria]="{ ariaLabel: 'Playback error', retryAriaLabel: 'Reload video' }"
/>

<!-- Fully custom content -->
<eva-error-overlay [evaCustomContent]="true">
  <div class="my-error-ui">
    <h3>Video unavailable</h3>
    <p>Please check your connection.</p>
    <button (click)="switchToFallbackSource()">Use backup source</button>
  </div>
</eva-error-overlay>

<!-- Listen for retry events -->
<eva-error-overlay (evaRetryClicked)="onRetry()" />
```

### Consumer Example

```typescript
import { Component, signal } from '@angular/core';
import { EvaErrorOverlay, EvaPlayer, EvaVideoSource } from 'ez-vid-ang';

@Component({
  selector: 'app-player',
  imports: [EvaPlayer, EvaErrorOverlay],
  template: `
    <eva-player id="player" [evaVideoSources]="sources()">
      <eva-error-overlay
        evaErrorText="Failed to load video."
        (evaRetryClicked)="onRetry()"
      />
    </eva-player>
  `
})
export class PlayerComponent {
  protected readonly sources = signal<EvaVideoSource[]>([
    { src: 'https://example.com/video.mp4', type: 'video/mp4' }
  ]);

  protected onRetry(): void {
    // Optionally switch to a fallback source
    // this.sources.set([{ src: 'https://cdn.example.com/video.mp4', type: 'video/mp4' }]);
  }
}
```

### Retry Behaviour

When the retry button is clicked:

1. `evaRetryClicked` is emitted so the consumer can run custom logic (e.g. switch to a backup source, log analytics).
2. `videoElement.load()` is called to reload the current sources. If the consumer changed `evaVideoSources` before the retry, the new sources are loaded.
3. The overlay hides automatically when the video state transitions away from `ERROR` (e.g. to `LOADING` after `load()`).

### Built-in UI

The default overlay consists of:
- An alert icon (circle with exclamation mark)
- A configurable error message (`evaErrorText`)
- A retry button (`evaRetryText`) with hover and focus-visible states

All elements can be replaced by setting `evaCustomContent="true"` and projecting your own content.

### Animation

The overlay fades in/out using `opacity` and `visibility` transitions, matching the library's `--eva-transition-duration` timing.

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-error-overlay-background` | `rgba(0, 0, 0, 0.85)` | Background of the overlay. |
| `--eva-error-overlay-gap` | `16px` | Gap between icon, message, and button. |
| `--eva-error-overlay-padding` | `24px` | Padding around the content. |
| `--eva-error-overlay-icon-size` | `48px` | Width and height of the alert icon. |
| `--eva-error-overlay-icon-color` | `rgba(255, 255, 255, 0.9)` | Fill color of the alert icon. |
| `--eva-error-overlay-font-size` | `14px` | Font size of the error message. |
| `--eva-error-overlay-text-color` | `rgba(255, 255, 255, 0.9)` | Color of the error message text. |
| `--eva-error-overlay-max-width` | `300px` | Max width of the message text. |
| `--eva-error-overlay-retry-padding` | `8px 24px` | Padding of the retry button. |
| `--eva-error-overlay-retry-border` | `1px solid rgba(255, 255, 255, 0.3)` | Border of the retry button. |
| `--eva-error-overlay-retry-border-radius` | `4px` | Border radius of the retry button. |
| `--eva-error-overlay-retry-background` | `rgba(255, 255, 255, 0.1)` | Background of the retry button. |
| `--eva-error-overlay-retry-hover-background` | `rgba(255, 255, 255, 0.2)` | Background on hover. |
| `--eva-error-overlay-retry-color` | `rgba(255, 255, 255, 0.9)` | Text color of the retry button. |
| `--eva-error-overlay-retry-font-size` | `14px` | Font size of the retry button. |
| `--eva-error-overlay-retry-focus-color` | `rgba(255, 255, 255, 0.6)` | Focus outline color. |

### `EvaErrorOverlayAria`

| Property | Type | Default | Description |
|---|---|---|---|
| `ariaLabel` | `string` | `"Video playback error"` | `aria-label` for the overlay container (`role="alert"`). |
| `retryAriaLabel` | `string` | `"Retry playback"` | `aria-label` for the retry button. |
