# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [22.0.2] - 2026-06-22

### Added

- **`EvaLoop`**: New loop toggle button component. Toggles `HTMLVideoElement.loop` on click or keyboard activation (`Enter`/`Space`). Reflects loop state via `eva-loop-active` host class and dynamic `aria-valuetext`. Syncs with `EvaApi.loopSubject` — stays in sync when `evaVideoConfiguration.loop` changes at runtime. Supports custom icons via content projection.
- **`EvaApi.loopSubject`**: New `BehaviorSubject<boolean>` that broadcasts the current loop state. Updated by `EvaVideoConfigurationDirective` and `EvaLoop`.
- **`EvaChapterList`**: New floating panel component that displays all available chapters in a scrollable list. Positioned in the top corner of the video element (`z-index: 1100`), above all other player UI. Opens/closes via `evaChapterListOpen` input (runtime-toggleable). Close button with `(evaChapterListClose)` output. Shows chapter title, start time, and duration. Active chapter is highlighted via `startTime` comparison. Handles edge cases: empty chapters (configurable empty text via `evaChapterListEmptyText`), empty titles (falls back to "Untitled"), invalid times (`NaN`/negative), and negative durations (hidden). Supports left/right positioning via `evaChapterListPosition`. Fully configurable via 25+ SCSS variables. Closes on Escape key and click-outside. Responsive — full-width on mobile (≤ 480px).
- **`EvaApi.hasExternalChapters`**: New flag that prevents VTT-parsed chapters from overwriting chapters provided via the `evaChapters` input.

### Bug Fixes

- **`EvaScrubBar`**: Hover tooltip, click-to-seek, and drag-to-seek used `scrollWidth` for percentage calculations. When chapter markers had positions exceeding 100% (chapter times beyond video duration), `scrollWidth` was inflated by the overflow, making all calculated times near zero (e.g. always showing "00:00 Intro"). Replaced with `clientWidth` which reflects the visible rendered width.
- **`EvaScrubBar`**: Chapters provided via the `evaChapters` input were not synced to `EvaApi.chapterMarkerChangesSubject`, so `EvaActiveChapter` and the per-frame chapter lookup in `updateVideoTime()` used VTT-parsed chapters instead of the input chapters. Now pushes input chapters to `chapterMarkerChangesSubject` on init.
- **`EvaVideoConfigurationDirective`**: Setting `loop: false` in `evaVideoConfiguration` was silently ignored because the guard used `if (config.loop)` (falsy check). Changed to `if (config.loop !== undefined)` so `false` is correctly applied. Loop changes now also broadcast to `EvaApi.loopSubject`.
- **`EvaKeyboardShortcuts`**: In multi-player setups, all players responded to every keystroke simultaneously. Now only the last-interacted player handles shortcuts. When focus is inside a specific `eva-player`, only that player responds.
- **`EvaKeyboardShortcuts`**: Number keys and other shortcuts were captured when focus was on custom widgets (dropdowns, sliders, etc.) that are not `<input>` or `<textarea>`. The input guard now also skips `<select>` elements and any element with an interactive ARIA role (`listbox`, `combobox`, `menu`, `menuitem`, `slider`, `spinbutton`, `textbox`, `searchbox`, `gridcell`).
- **`validateAndTransformEvaKeyboardShortcutsConfiguration`**: Default config values were stored in ALL-UPPERCASE (`"ARROWLEFT"`) but JSDoc documented mixed-case defaults (`"ArrowLeft"`). All key values are now normalized to uppercase via `.toUpperCase()` in the transform, making consumer-provided casing irrelevant. Removed redundant per-keystroke `.toUpperCase()` calls on config values in the keyboard handler.
- **`EvaFullscreenAPI`**: Stale JSDoc `@example` and `@param` on `toggleFullscreen()` still referenced the old two-argument signature. Updated to reflect the current no-arg signature.
- **`EvaChapterList`**: Click-outside handler fired on the same click event that opened the panel, causing it to open and immediately close. Fixed with a 50ms debounce after open.
- **`EvaVideoConfigurationDirective`**: All boolean config properties (`autoplay`, `controls`, `muted`, `disablePictureInPicture`, `disableRemotePlayback`, `playinline`) used truthy checks (`if (config.X)`) which prevented setting them back to `false` at runtime. Changed all to `!== undefined` guards (same fix already applied to `loop`).
- **`EvaKeyboardShortcuts`**: `lastActiveApi` retained a reference to a destroyed `EvaApi` instance in multi-player teardown scenarios, permanently locking surviving players out of keyboard shortcuts. Now validates the reference is still alive via `isPlayerReady` before comparing.
- **`EvaKeyboardShortcuts`**: Duplicate `keydown` listeners could accumulate if the `effect()` re-ran with `true` on consecutive change detection cycles. Now calls `removeEventListener` before `addEventListener` to prevent duplicates.
- **`EvaScrubBar`**: `hasExternalChapters` was never reset when the `evaChapters` input was cleared to `[]`, permanently blocking VTT chapter loading. Now resets the flag and clears chapters via `ngOnChanges` when the input changes at runtime.
- **`EvaApi.volumeChanged()`**: Accessed `assignedVideoElement!.volume` without calling `validateVideoAndPlayerBeforeAction()`, unlike other event callbacks. Added the guard.
- **`EvaApi.loadedVideoMetadata()`**: Accessed `assignedVideoElement!.duration` without a null guard. Added an early return if `assignedVideoElement` is null.
- **`EvaLoop.toggleLoop()`**: Only checked `assignedVideoElement` for null but did not use `validateVideoAndPlayerBeforeAction()`. Now uses the full validation guard.
- **`EvaChapterList.seekToChapter()`**: Did not coordinate with the seek state (`isSeeking`, `pendingPlayAfterSeek`). Now sets `isSeeking` and resumes playback after seek if the video was playing.
- **`EvaVideoConfigurationDirective`**: `startingVolume: 0` was silently ignored because the guard used `if (config.startingVolume)` (truthiness check). Changed to `if (config.startingVolume !== undefined)` so `0` is correctly applied.
- **`EvaScrubBar`**: `seekEnd()` returned early when `newTime` was `NaN` without resetting `wasPlaying`, leaving the video permanently paused after an invalid seek. Now resets `wasPlaying` on all early-return paths.
- **`EvaApi.muteOrUnmuteVideo()`**: Unmuting restored `lastActiveVolume` which could be `0` if the user had dragged the volume slider to zero. Now saves the current volume before muting (only when > 0) and falls back to `0.75` if `lastActiveVolume` is `0`.
- **`EvaScrubBar`**: `controlsSelectorComponentActive` subscription (a `BehaviorSubject`) immediately emitted `false` on subscribe, scheduling an auto-hide before any user interaction. Added `skip(1)` to ignore the initial emission.
- **`EvaScrubBar`**: `getTouchOffset()` accessed `event.touches[0]` without checking that `touches` is non-empty. Added a guard returning `0` when the touch list is empty.
- **`EvaScrubBar`**: `touchStartScrub` passed `false` to `seekEnd()` when `evaSlidingEnabled` was `false`, discarding the touch position entirely. The video never seeked on tap. Now computes the touch offset via `getTouchOffset()`, matching the mouse path behaviour.
- **`EvaScrubBar`**: `prepareHiding()` was called unconditionally from the `triggerUserInteraction` subscription, scheduling a hide timeout even while a selector dropdown (quality, speed) was open. The scrub bar would hide behind the open dropdown. Now skips scheduling when `isControlerSelectorActive` is `true`.

### Improved

- **`EvaChapterList`**: Panel now closes on `Escape` key (document-level) and click outside the panel. Both emit `evaChapterListClose` so the consumer's signal stays in sync.

### Internal

- Removed commented-out double-tap-to-seek `touchend` code and unused `lastTapTime` field from `EvaMediaEventListenersDirective`.
- Fixed broken `keyboard-shortcuts.spec.ts` — replaced direct `new EvaKeyboardShortcuts()` (which crashed outside an injection context) with a `TestBed`-based test using a host component.

### Documentation

- **`documentation/core/eva-api.md`**: Added `loopSubject` to the Subjects table.
- **`documentation/core/player.md`**: Updated keyboard shortcuts notes with multi-player scoping, casing normalization, and expanded input guard.
- **`documentation/core/directives.md`**: Updated `EvaKeyboardShortcuts` description with multi-player scoping, expanded suppression list, and template directive correction.
- **`documentation/core/fullscreen-api.md`**: Updated `toggleFullscreen` signature in the public API table.
- **`documentation/controls/chapter-list.md`**: Created full documentation with inputs, usage examples with TypeScript integration, chapter item display, keyboard support, and 20+ SCSS variables.
- **`documentation/controls/loop.md`**: Created full documentation with inputs, 4 usage examples, host classes, keyboard support, SCSS variables, and ARIA types.
- **`documentation/controls/scrub-bar.md`**: Updated Chapter Markers section to document sync to `chapterMarkerChangesSubject` and VTT-skip behavior when `evaChapters` is provided.

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

- Added usage examples across 15 documentation files.
- Created full documentation for `EvaQualitySelector`.
- Added `jumpToVideoPercentage` to the `EvaApi` playback commands table.
- Updated `toggleFullscreen` signature in `EvaFullscreenAPI` docs.
- Added JSDoc to all new types, functions, and components.

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
