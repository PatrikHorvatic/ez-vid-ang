## EvaEndedOverlay

Ended overlay component for the Eva video player. Covers the full player area and becomes visible automatically when the video reaches the `ENDED` state. The overlay is a pure content container — all UI is supplied by the consumer via content projection, giving full control over replay buttons, next-video cards, social share prompts, and any other end-of-video experience.

The overlay is suppressed when the video has `loop` enabled to prevent a flash of the ended state before the video restarts.

### Selector

```html
<eva-ended-overlay />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaAria` | `EvaEndedOverlayAria` | No | See below | ARIA label for the overlay container. |

### Usage

```html
<!-- Minimal — replay button -->
<eva-player id="my-player" [evaVideoSources]="sources()">
  <eva-ended-overlay>
    <button (click)="replay()">Replay</button>
  </eva-ended-overlay>
  <eva-overlay-play />
  <eva-controls-container>
    <eva-play-pause />
    <eva-scrub-bar />
  </eva-controls-container>
</eva-player>

<!-- Custom ARIA label -->
<eva-ended-overlay [evaAria]="{ ariaLabel: 'Video finished' }">
  <div class="end-card">...</div>
</eva-ended-overlay>
```

### Consumer Example

```typescript
import { Component, signal } from '@angular/core';
import { EvaEndedOverlay, EvaPlayer, EvaVideoSource } from 'ez-vid-ang';

@Component({
  selector: 'app-player',
  imports: [EvaPlayer, EvaEndedOverlay],
  template: `
    <eva-player id="player" [evaVideoSources]="sources()">
      <eva-ended-overlay>
        <div class="end-card">
          <p>Thanks for watching!</p>
          <button (click)="replay()">Watch again</button>
        </div>
      </eva-ended-overlay>
      <eva-overlay-play />
      <eva-controls-container>
        <eva-play-pause />
        <eva-scrub-bar />
      </eva-controls-container>
    </eva-player>
  `
})
export class PlayerComponent {
  protected readonly sources = signal<EvaVideoSource[]>([
    { src: 'https://example.com/video.mp4', type: 'video/mp4' }
  ]);

  protected replay(): void {
    // seek back to beginning — the player will show the overlay until play resumes
  }
}
```

### Visibility Behaviour

- The overlay becomes visible when `EvaApi.videoStateSubject` emits `EvaState.ENDED`.
- The overlay hides automatically when the video state changes (e.g. on replay, source change, or error).
- When the video has `loop` enabled (`evaVideoConfiguration.loop = true` or the native `loop` attribute), the overlay never shows — the video restarts before the state is surfaced.
- No consumer wiring is required; state tracking is handled internally via `EvaApi`.

### Content Projection

`<eva-ended-overlay>` renders only `<ng-content />` — there is no built-in UI. You are responsible for providing all visual content. Common patterns:

```html
<!-- Replay button -->
<eva-ended-overlay>
  <button class="replay-btn" aria-label="Replay video" (click)="replay()">
    ↺ Replay
  </button>
</eva-ended-overlay>

<!-- Next video card -->
<eva-ended-overlay>
  <div class="next-card">
    <img [src]="nextVideo().thumbnail" alt="" />
    <span>Up next: {{ nextVideo().title }}</span>
    <button (click)="playNext()">Play</button>
  </div>
</eva-ended-overlay>

<!-- Fully custom end screen -->
<eva-ended-overlay>
  <ng-container *ngTemplateOutlet="endScreenTemplate" />
</eva-ended-overlay>
```

### Animation

The overlay fades in and out using `opacity` and `visibility` transitions, respecting the `--eva-transition-duration` CSS variable shared across the library.

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-ended-overlay-background` | `rgba(0, 0, 0, 0.85)` | Background colour of the overlay. |
| `--eva-transition-duration` | `0.25s` | Shared library variable controlling the fade-in/out duration. |

### `EvaEndedOverlayAria`

| Property | Type | Default | Description |
|---|---|---|---|
| `ariaLabel` | `string` | `"Video ended"` | `aria-label` for the overlay container (`role="alert"`). Announced by screen readers when the overlay becomes visible. |
