# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [22.0.0] - 2026-06-05

### Breaking Changes

- **`EvaBackward`**: Input renamed from `evaForwardSeconds` to `evaBackwardSeconds`. Update any template bindings: `[evaForwardSeconds]="30"` → `[evaBackwardSeconds]="30"`.

### Bug Fixes

- **`EvaPlayPause`**: `aria-label` was inverted — screen readers announced "play" while the video was playing and "pause" while paused. The label now correctly reflects the next action: "pause" when playing, "play" otherwise.
- **`EvaFullscreen`**: Fullscreen toggle used `document.querySelector('eva-player')` which always targeted the first player on the page. Now uses `assignedVideoElement.closest('eva-player')` so each button operates on its own player instance in multi-player setups.
- **`EvaPlaybackSpeed`**: Default speed was incorrectly set at initialisation when the matching speed was at index `0` (`index !== 1` check replaced with `index !== -1`).
- **`EvaMute`**: `muteAriaValueText` computed contained a dead branch (`!this.videoVolume`) that could never be true — a signal reference is always truthy. Simplified to a direct value check.
- **`EvaVolume`** / **`EvaScrubBar`**: Invalid `aria-level: "polite"` attribute removed from both host objects. `aria-level` is a heading-rank attribute (integer 1–6); it had no effect on sliders and was silently ignored by assistive technologies.
- **`EvaHlsDirective`**: `EvaTimeDisplay` and other components that depend on `EvaApi.isLive` never showed "LIVE" for HLS live streams when hls.js was in use. The root cause: `EvaApi` detects live streams by checking `video.duration === Infinity` on `loadedmetadata`, which is correct for native HLS (Safari), but hls.js feeds the browser via MSE with a finite DVR-window duration so `Infinity` is never set. Fixed by listening to `Hls.Events.LEVEL_LOADED` and writing `data.details.live` directly to `EvaApi.isLive`. The event fires each time a level playlist is fetched, providing accurate live detection across source changes.

### Accessibility

- **`EvaVolume`**: The host element (`<eva-volume>`) and the inner `<div #volumeBar>` both declared `role="slider"` and `tabindex="0"`, creating two nested tabbable sliders in the accessibility tree. The outer one had no keyboard handler, making it a dead tab stop. All ARIA attributes (`role`, `aria-valuenow`, `aria-valuetext`, `aria-valuemin`, `aria-valuemax`, `aria-orientation`, `aria-label`) and all event handlers (`click`, `mousedown`, `keydown`, `touchstart`, `focus`, `blur`) are now consolidated on the host element, matching the pattern used by `EvaScrubBar`.

### Changed

- **`EvaBackward`**: Input renamed `evaForwardSeconds` → `evaBackwardSeconds` (see Breaking Changes above).
- **`aria-utilities.ts`**: All 13 transform functions updated from verbose falsy-check ternaries (`v.prop ? v.prop : "default"`) to null-coalescing (`v.prop ?? "default"`).
- **`aria-utilities.ts`**: Fixed typo in `transformEvaPictureInPictureAria` default value: `"invactive"` → `"inactive"`.

### Removed

- **`EvaApi`**: Removed empty no-op method `setFirstSubtitles()` from the public API.

### Internal

- Replaced all deprecated `KeyboardEvent.keyCode` usage with `KeyboardEvent.key` string comparisons across `EvaPlayPause`, `EvaFullscreen`, `EvaMute`, `EvaForward`, `EvaBackward`, `EvaPictureInPicture`, and `EvaOverlayPlay`.
- Removed explicit `WritableSignal<T>` type annotations where the type is already inferred from `signal()` across `EvaScrubBar`, `EvaVolume`, `EvaControlsContainer`, `EvaPlayPause`, `EvaFullscreen`, `EvaMute`, `EvaPictureInPicture`, `EvaOverlayPlay`, and `EvaTrackSelector`.
- Replaced lazy-initialised signal pattern (`protected foo!: WritableSignal<T>` assigned in `ngOnInit`) with inline `signal(defaultValue)` + `.set()` in `ngOnInit` in `EvaMute`, `EvaVolume`, and `EvaTrackSelector`.
- Removed redundant null guards in `EvaTrackSelector.currentTrack` computed (signal arrays are always truthy).
- Removed dead commented-out code: `viewChild`/`viewChildren` declarations in `EvaPlayer`, `mousemove`/`mouseleave` listener stubs in `EvaScrubBar`, `textTrack.mode` block in `EvaTrackSelector`, unused `timingSub` field in `EvaActiveChapter`.
- Updated `EvaQualityLevel` JSDoc: replaced outdated `getBitrateInfoListFor('video')` reference with `getRepresentationsByType('video')` (dash.js 5.x API).

### Documentation

- **`EvaBackward`**: Corrected all three JSDoc references from `evaForwardSeconds` to `evaBackwardSeconds`.
- Removed stale keyCode numbers (`(13)`, `(32)`, `(38, 39)`, `(37, 40)`) from keyboard handler JSDoc across `EvaMute`, `EvaPictureInPicture`, `EvaOverlayPlay`, `EvaActiveChapter`, `EvaPlayPause`, and `EvaScrubBar`.
- **`EvaControlsContainer`**: Removed resolved `@todo` annotation and orphaned inline comment about `NodeJS.Timeout` (the type is already `ReturnType<typeof setTimeout>`).

---

## [21.2.0] - previous release

See git history for changes prior to this version.
