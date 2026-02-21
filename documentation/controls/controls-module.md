## EvaControlsModule

The `NgModule` that declares and exports all Eva player control components, the scrub bar sub-components, and the time display pipe. Import this module into your application module to make all controls available.

---

### Usage

```ts
import { EvaControlsModule } from 'eva-player';

@NgModule({
  imports: [EvaControlsModule]
})
export class AppModule { }
```

---

### Exported Members

| Member | Type | Description |
|---|---|---|
| `EvaControlsContainerComponent` | Component | Container that wraps player controls and drives auto-hide behaviour. |
| `EvaFullscreen` | Component | Fullscreen toggle button. |
| `EvaMute` | Component | Mute/unmute toggle button. |
| `EvaOverlayPlay` | Component | Centered overlay play button shown when the video is paused. |
| `EvaPlayPause` | Component | Play/pause toggle button. |
| `EvaPlaybackSpeed` | Component | Playback speed selector. |
| `EvaQualitySelector` | Component | Quality/bitrate level selector for HLS and DASH streams. |
| `EvaScrubBar` | Component | Seek/scrub bar with optional chapter marker support. |
| `EvaScrubBarCurrentTimeComponent` | Component | Scrub bar sub-component that tracks the current playback position indicator. |
| `EvaScrubBarBufferingTimeComponent` | Component | Scrub bar sub-component that visualises the buffered range. |
| `EvaTimeDisplay` | Component | Displays current, total, or remaining playback time. |
| `EvaTimeDisplayPipe` | Pipe | Formats a time value in seconds to a string using `EvaTimeFormating`. |
| `EvaTrackSelector` | Component | Subtitle and caption track selector. |
| `EvaVolume` | Component | Volume slider control. |