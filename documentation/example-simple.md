# Simple Example

A minimal player with just the essential controls — play/pause, volume, time display, scrub bar, and fullscreen. No streaming, no chapters, no settings panel.

See also: [Full-Featured Example](example-configuration.md) for every available component and feature.

```html
<eva-player
  #player
  [id]="'simple'"
  [evaVideoSources]="sources()"
  [evaVideoConfiguration]="{ crossorigin: 'anonymous', preload: 'auto' }"
  [evaKeyboardShortcutsEnabled]="true"
>
  <eva-overlay-play />
  <eva-buffering />
  <eva-error-overlay />

  <eva-scrub-bar [evaShowTimeOnHover]="true" [hideWithControlsContainer]="true">
    <eva-scrub-bar-buffering-time />
    <eva-scrub-bar-current-time />
  </eva-scrub-bar>

  <eva-controls-container evaUserInteractionEvents [evaAutohide]="true">
    <eva-play-pause />
    <eva-mute />
    <eva-volume />
    <eva-time-display evaTimeProperty="current" evaTimeFormating="mm:ss" />
    <eva-controls-divider />
    <eva-time-display evaTimeProperty="total" evaTimeFormating="mm:ss" />
    <eva-fullscreen />
  </eva-controls-container>
</eva-player>
```

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  EvaBuffering,
  EvaControlsContainer,
  EvaControlsDivider,
  EvaErrorOverlay,
  EvaFullscreen,
  EvaMute,
  EvaOverlayPlay,
  EvaPlayer,
  EvaPlayPause,
  EvaScrubBar,
  EvaScrubBarBufferingTime,
  EvaScrubBarCurrentTime,
  EvaTimeDisplay,
  EvaUserInteractionEventsDirective,
  EvaVideoSource,
  EvaVolume,
} from 'ez-vid-ang';

@Component({
  selector: 'app-simple-player',
  templateUrl: './simple-player.html',
  styleUrl: './simple-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EvaBuffering,
    EvaControlsContainer,
    EvaControlsDivider,
    EvaErrorOverlay,
    EvaFullscreen,
    EvaMute,
    EvaOverlayPlay,
    EvaPlayer,
    EvaPlayPause,
    EvaScrubBar,
    EvaScrubBarBufferingTime,
    EvaScrubBarCurrentTime,
    EvaTimeDisplay,
    EvaUserInteractionEventsDirective,
    EvaVolume,
  ],
})
export class SimplePlayerComponent {
  protected readonly sources = signal<EvaVideoSource[]>([
    { type: 'video/mp4', src: '/video.mp4' },
  ]);
}
```

```scss
:host {
  display: block;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}
```
