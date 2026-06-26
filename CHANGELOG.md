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
- **ESLint**: Added strict linting configuration using `angular-eslint` v22, `typescript-eslint` v8, and ESLint v10 flat config. Enabled all available presets (`eslint.configs.all`, `tseslint.configs.all`, `angular.configs.tsAll`, `angular.configs.templateAll`, `angular.configs.templateAccessibility`). The project now passes linting with zero errors.
- **`constants.ts`**: New centralized constants file. All magic numbers across the library are replaced with named, non-reassignable constants organized by category (time conversion, percentages, volume, seek, buffering, timeouts, UI layout). Imported by 16 source files.
- **`FullscreenPolyfill` interface**: Typed the previously `any`-typed fullscreen API polyfill object in `EvaFullscreenAPI`, eliminating all unsafe member access and unsafe call errors in `fullscreen.ts`.
- **`npm run lint`**: Lint script (`ng lint`) was added to `package.json`.

### Bug Fixes

- **`EvaApi`**:
  - `playOrPauseVideo()` did not catch the `play()` promise — rapid toggling caused uncaught `AbortError`.
  - `time().remaining` was `Infinity` on live streams after every `timeupdate`. Now returns `0`.
  - `time.total` set to `NaN` when video duration was unavailable, corrupting downstream seek calculations.
  - `loadedVideoMetadata()` accessed `assignedVideoElement!.duration` without a null guard.
  - `volumeChanged()` accessed `assignedVideoElement!.volume` without calling `validateVideoAndPlayerBeforeAction()`.
  - `muteOrUnmuteVideo()` — unmuting restored `lastActiveVolume` which could be `0`. Now falls back to `0.75`.
- **`EvaFullscreenAPI`**:
  - `exitFullscreen()` broken on iOS — called method on `document` instead of the `<video>` element.
  - iOS fullscreen change listener attached to `document` instead of the `<video>` element — never fired.
  - Non-iOS mobile fallback to `<video>` element was unreachable. Fixed condition to check `request in targetElement`.
  - `isiOSDevice()` missed iPadOS 13+ (desktop user agent). Added `navigator.maxTouchPoints` check.
  - Stale JSDoc on `toggleFullscreen()` still referenced the old two-argument signature.
- **`EvaScrubBar`**:
  - Hover tooltip, click-to-seek, and drag-to-seek used `scrollWidth` instead of `clientWidth` for percentage calculations.
  - Chapters provided via `evaChapters` input were not synced to `EvaApi.chapterMarkerChangesSubject`.
  - `hasExternalChapters` was never reset when `evaChapters` was cleared to `[]`.
  - `seekEnd()` returned early on `NaN` without resetting `wasPlaying`, leaving the video permanently paused.
  - `controlsSelectorComponentActive` subscription immediately emitted `false` on subscribe. Added `skip(1)`.
  - `getTouchOffset()` accessed `event.touches[0]` without checking that `touches` is non-empty.
  - `touchStartScrub` passed `false` to `seekEnd()` when `evaSlidingEnabled` was `false` — tap-to-seek was broken.
  - `prepareHiding()` fired while a dropdown was open, hiding the scrub bar behind it.
- **`EvaControlsContainer`**:
  - Subscription leaks when toggling `evaAutohide` — `startListening()` and `disableHiding()` now clean up existing subscriptions.
  - `controlsSelectorComponentActive` BehaviorSubject emitted on subscribe, double-scheduling the hide timeout. Added `skip(1)`.
  - `prepareHiding()` fired while a dropdown was open. Added `isControlerSelectorActive` guard.
  - `ngOnDestroy` did not clear `hideTimeout`.
- **`EvaVideoConfigurationDirective`**:
  - All boolean config properties used truthy checks, preventing `false` values at runtime. Changed to `!== undefined`.
  - `startingVolume: 0` was silently ignored. Changed to `!== undefined`.
  - `startingVolume` not synced to `lastActiveVolume` during init — mute/unmute restored to wrong volume.
- **`EvaKeyboardShortcuts`**:
  - In multi-player setups, all players responded to every keystroke simultaneously.
  - Shortcuts were captured when focus was on custom widgets with interactive ARIA roles.
  - `lastActiveApi` retained a reference to a destroyed `EvaApi` instance.
  - Duplicate `keydown` listeners could accumulate on consecutive `effect()` re-runs.
  - Key config values normalized to uppercase via `.toUpperCase()` in the transform.
- **`EvaPlaybackSpeed`**:
  - Null dereference in `handleBlur` when `relatedTarget` is `null`. Added `instanceof HTMLElement` guard.
  - Default speed not applied when component mounted after player was already ready.
- **`EvaQualitySelector`**:
  - Null dereference in `onBlur` when `relatedTarget` is `null`. Added `instanceof HTMLElement` guard.
  - Missing `instanceof` guard in `handleClickOutside`.
  - Keyboard navigation crashed when qualities array was empty.
- **`EvaTimeDisplay`**: `'ss'` format returned `m:ss` instead of total seconds. Added negative value clamping. Aligned `formatTime` with pipe for `mm:ss` format (hours overflow).
- **`EvaScrubBarCurrentTime`**: Operator precedence bug — rounded before dividing, producing unrounded decimals. Added `total === 0` guard.
- **`EvaScrubBarBufferingTime`**: Division by zero when `time.total` is `0` before metadata loads.
- **`EvaCueChangeDirective`**: Duplicate `cuechange` listeners when toggling active repeatedly. Added `detach()` before re-attaching.
- **`EvaDashDirective`**: `STREAM_INITIALIZED` callback accessed `this.dash` without null guard. DRM config shallow copy mutated the consumer's input object.
- **`EvaChapterList`**:
  - Click-outside handler fired on the same click that opened the panel. Fixed with a 50ms debounce.
  - `seekToChapter()` did not coordinate with the seek state. Now sets `isSeeking` and resumes playback.
  - Click-outside handler used unsafe `as Node` cast instead of `instanceof` guard.
- **`EvaVolume`**: `onTouchStart` accessed `e.touches[0]` without length check. Inner announcement reset timeout not cleaned up on destroy.
- **`EvaTrackSelector`**: Screen reader announcement DOM element and timeout not cleaned up on destroy.
- **`EvaLoop`**: `toggleLoop()` did not use `validateVideoAndPlayerBeforeAction()`. Now uses the full validation guard.

### Improved

- **`EvaChapterList`**: Panel now closes on `Escape` key and click outside.

### Changed (Linting)

- Added strict ESLint configuration with all available presets. Project passes with zero errors.
- Merged duplicate imports across 48 files. Removed `import type` syntax.
- Added explicit return types to all functions across 13 files.
- Fixed `inject(ElementRef<T>)` → `inject<ElementRef<T>>(ElementRef)` in 4 files to preserve generic type.
- Replaced unsafe `as any` casts with `instanceof` guards and typed patterns across fullscreen, event listeners, keyboard shortcuts, and click-outside handlers.
- Replaced `as VTTCue` / `as PictureInPictureEvent` casts with runtime `instanceof` checks.
- Removed unnecessary `async` from methods without `await`. Replaced `console.error` with `console.warn`.
- Renamed `EvaPictureInPictureTransformed` to `EvaPictureInPictureAriaTransformed` for naming consistency with other ARIA transformed types.

### Internal

- Removed dead double-tap-to-seek code from `EvaMediaEventListenersDirective`.
- Fixed `keyboard-shortcuts.spec.ts` to use `TestBed` host component.
- Added `constants.ts` — centralized all magic numbers into named constants.
- Added `FullscreenPolyfill` interface to type the previously `any` polyfill object.

### Documentation

- New: `documentation/core/linting.md`, `documentation/core/constants.md`.
- New: `documentation/controls/chapter-list.md`, `documentation/controls/loop.md`.
- Updated: `eva-api.md`, `fullscreen-api.md`, `player.md`, `directives.md`, `scrub-bar.md`, `time-display.md`, `container.md`, `dash.md`.

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
