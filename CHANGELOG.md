# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [22.0.1] - 2026-06-21

### Added

- **`EvaKeyboardShortcuts`**: New directive that enables configurable keyboard shortcuts on the player. Listens on the `document` for `keydown` events and dynamically adds/removes the listener via `effect()` based on `evaKeyboardShortcutsEnabled`. Shortcuts are suppressed when focus is inside an `<input>`, `<textarea>`, or `contenteditable` element. Applied as a host directive on `EvaPlayer`.
- **`EvaPlayer`**: Two new inputs — `evaKeyboardShortcutsEnabled` (`boolean`, default `false`) and `evaKeyboardShortcutsConfiguration` (`EvaKeyboardShortcutsConfiguration`, merged with defaults via `validateAndTransformEvaKeyboardShortcutsConfiguration`).
- **`EvaKeyboardShortcutsConfiguration`**: New configuration interface with the following properties (all optional, with defaults):
  - `backwardsKeyOne` (`"J"`) / `forwardKeyOne` (`"L"`) — primary seek keys.
  - `backwardsKeyTwo` (`"ArrowLeft"`) / `forwardKeyTwo` (`"ArrowRight"`) — secondary seek keys.
  - `backwardSeconds` (`10`) / `forwardSeconds` (`10`) — configurable seek duration in seconds, validated to be greater than `0`.
  - `muteKey` (`"M"`) — toggle mute.
  - `playPause` (`"Space"`) — toggle play/pause (matched via `KeyboardEvent.code`).
  - `fullscreen` (`"F"`) — toggle fullscreen.
  - `oneFrameBackward` (`","`) / `oneFrameForward` (`"."`) — step one frame at 30fps.
  - Number keys `0`–`9` — jump to 0%–90% of total duration (not configurable, ignored for live streams).
- **`EvaApi.jumpToVideoPercentage(key)`**: New method that seeks to a percentage of total duration based on a digit key (`"0"`–`"9"`). Ignored for live streams.
- **`EvaMediaEventListenersDirective`**: Double-click on the video element now toggles fullscreen via `EvaFullscreenAPI`.
- **`EvaVideoEvent.DOUBLE_CLICK`**: New enum member (`"dblclick"`).

### Changed

- **`EvaFullscreenAPI.toggleFullscreen()`**: Signature changed from `(element, videoElement?)` to no-arg. The service now resolves the video element and player container internally via `EvaApi.assignedVideoElement` and `closest('eva-player')`.
- **`EvaOverlayPlay`**: Removed explicit `(keydown)` host handler; added `role="button"` to the host so browsers synthesize `click` events from `Enter`/`Space`, maintaining keyboard accessibility with less code.
- **`EvaApi.assignedVideoElement`**: Type changed from `HTMLVideoElement` (non-null assertion) to `HTMLVideoElement | null` for stricter null safety.
- **`validateAndTransformEvaKeyboardShortcutsConfiguration`**: `backwardSeconds` and `forwardSeconds` are validated to be greater than `0`; values `<= 0` fall back to the default `10`.

### Documentation

- **`documentation/core/player.md`**: Added `evaKeyboardShortcutsEnabled` and `evaKeyboardShortcutsConfiguration` to the inputs table. Added `EvaKeyboardShortcutsConfiguration` type reference with default keyboard shortcuts table. Expanded usage from 2 to 6 examples including minimal, full-featured player layout, and HLS streaming.
- **`documentation/core/directives.md`**: Added `EvaKeyboardShortcuts` directive section with inputs, keyboard actions, usage, and notes. Updated `EvaUserInteractionEventsDirective` listened events table with `dblclick` and `touchend` double-tap. Added usage examples for `EvaUserInteractionEventsDirective`.
- **`documentation/core/eva-api.md`**: Added `jumpToVideoPercentage` to the playback commands table.
- **`documentation/core/fullscreen-api.md`**: Added programmatic usage examples with TypeScript service injection and template conditional rendering.
- **`documentation/controls/quality-selector.md`**: Created full documentation with inputs, 4 usage examples (minimal, custom labels, HLS combo, DASH combo), keyboard support, and SCSS variables.
- **`documentation/controls/container.md`**: Added 3 usage examples: with `evaUserInteractionEvents`, full controls bar with divider, and minimal no-auto-hide layout.
- **`documentation/controls/scrub-bar.md`**: Added 3 usage examples: click-to-seek only, custom ARIA with HH:mm:ss tooltip, and full player layout with scrub bar outside the controls container.
- **`documentation/controls/time-display.md`**: Added 3 usage examples: current/total YouTube-style pattern, left/right layout with divider, and live stream with custom badge.
- **`documentation/controls/time-display-pipe.md`**: Added 3 usage examples: total seconds format, custom component with `EvaApi.time()`, and remaining time with hours.
- **`documentation/controls/volume.md`**: Added 2 usage examples: paired with mute button, and paired with custom volume thresholds.
- **`documentation/controls/playback-speed.md`**: Added 3 usage examples: fine-grained speeds for educational content, podcast speeds, and inside a full controls bar.
- **`documentation/controls/track-selector.md`**: Added a full player example with subtitle tracks, subtitle display, and custom labels.
- **`documentation/controls/fullscreen.md`**: Added a controls bar placement example showing typical end-of-bar positioning.
- **`documentation/controls/subtitle-display.md`**: Added a full setup example with subtitle tracks and track selector. Added a note about required placement outside `eva-controls-container`.
- **`documentation/buffering/buffering.md`**: Added 2 usage examples: text-based loading indicator and full player layout showing recommended component order.
- **`documentation/example-configuration.md`**: Added `evaKeyboardShortcutsEnabled`, `evaKeyboardShortcutsConfiguration`, and `EvaKeyboardShortcutsConfiguration` import to the full example.
- Added JSDoc to `EvaKeyboardShortcutsConfiguration` interface and all its properties, `EvaKeyboardShortcuts` directive class, `jumpToVideoPercentage`, `prepareDefaultKeyboardShortcutsConfiguration`, `validateAndTransformEvaKeyboardShortcutsConfiguration`, and `EvaPlayer` keyboard shortcut inputs.

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
