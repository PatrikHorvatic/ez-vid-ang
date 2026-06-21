# EvaFullscreenAPI

Service that manages fullscreen state for the Eva video player. Provided at root level and injected into `EvaPlayer` and `EvaFullscreen`. Abstracts cross-browser and cross-platform fullscreen API differences by detecting the available vendor-prefixed API variant on construction.

### Supported API Variants

Detected in priority order. The first match wins.

| Variant | API used | Notes |
|---|---|---|
| `w3` | `requestFullscreen` / `exitFullscreen` | W3C standard — Chrome, Firefox, Edge |
| `newWebkit` | `webkitRequestFullscreen` | Modern WebKit |
| `oldWebkit` | `webkitRequestFullScreen` | Legacy WebKit |
| `moz` | `mozRequestFullScreen` | Firefox legacy |
| `ios` | `webkitEnterFullscreen` on `<video>` | Always used on iOS regardless of detection result |
| `ms` | `msRequestFullscreen` | Internet Explorer / Edge Legacy |

iOS is handled specially — `webkitEnterFullscreen` must be called on the `<video>` element directly, not the player container. The service always overrides the detected polyfill to `ios` on iOS devices.

### Public API

| Method / Property | Signature | Description |
|---|---|---|
| `isFullscreenObs` | `Observable<boolean>` | Stream of fullscreen state changes. Subscribe to react to enter/exit events. |
| `isFullscreen` | `() => boolean` | Returns current fullscreen state synchronously. |
| `isFullscreenSupported` | `() => boolean` | Returns whether a supported fullscreen API was detected. Use to conditionally show the fullscreen button. |
| `enterFullscreen` | `(element: HTMLElement, videoElement?: HTMLVideoElement) => Promise<void>` | Requests fullscreen on `element`. On iOS or mobile without container support, targets `videoElement` instead. |
| `exitFullscreen` | `() => Promise<void>` | Exits fullscreen via `document`. |
| `toggleFullscreen` | `(element: HTMLElement, videoElement?: HTMLVideoElement) => Promise<void>` | Exits if currently fullscreen, enters otherwise. |
| `destroy` | `() => void` | Completes `isFullscreenSubject`. Called from `EvaPlayer.ngOnDestroy`. |

### Usage

Most consumers interact with fullscreen through the `<eva-fullscreen />` component, which handles `EvaFullscreenAPI` internally. Direct service usage is only needed when building custom controls or triggering fullscreen programmatically.

```typescript
import { Component, inject } from '@angular/core';
import { EvaFullscreenAPI } from 'ez-vid-ang';

@Component({ ... })
export class CustomFullscreenButton {
  private fullscreenService = inject(EvaFullscreenAPI);

  async toggle() {
    await this.fullscreenService.toggleFullscreen();
  }
}
```

```html
<!-- Conditionally show fullscreen button based on browser support -->
@if (fullscreenService.isFullscreenSupported()) {
  <button (click)="toggle()">Toggle Fullscreen</button>
}

<!-- React to fullscreen state changes -->
<!-- In component: isFullscreen$ = this.fullscreenService.isFullscreenObs; -->
@if (isFullscreen$ | async) {
  <span>Currently in fullscreen</span>
}
```