# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [22.0.8, 21.2.8] - 2026-07-10

### Added

- **`EvaTrackSelector` — manifest-native HLS/DASH subtitle tracks are now selectable**: Previously, `eva-track-selector` only listed tracks declared via `evaVideoTracks`; subtitle tracks embedded in an HLS/DASH manifest could only be globally suppressed or restored (`[22.0.8, 21.2.8]`), not switched from the dropdown. `EvaHlsDirective` (`SUBTITLE_TRACKS_UPDATED`) and `EvaDashDirective` (`getTracksFor('text')` after `STREAM_INITIALIZED`) now register discovered tracks via two new `EvaApi` members, `registerStreamSubtitleTracks()` and `registerSubtitleTrackFn()`, mirroring the existing audio-track pattern. `eva-track-selector` merges these with any `evaVideoTracks`-declared tracks into a single dropdown with one "Off" state; the two sources are mutually exclusive. Manifest tracks are never auto-selected — even one marked `DEFAULT=YES` — so subtitles stay off until explicitly picked. New public members: `EvaStreamSubtitleTrack` type, `EvaApi.streamSubtitleTracksSubject`, `EvaApi.currentStreamSubtitleTrackId`, `EvaApi.setStreamSubtitleTrack()`. `EvaTrackInternal` gains optional `source`/`streamId` fields (backward compatible).

### Fixed

- **`EvaHlsDirective` — manifest subtitle tracks no longer auto-display**: hls.js renders manifest-embedded subtitle tracks natively and, by default, auto-shows whichever track is marked `DEFAULT=YES`, regardless of `EvaTrackSelector`'s own "Off"-by-default state. `subtitleDisplay: false` is now set by default in the hls.js config so subtitles stay hidden until explicitly enabled. Override via `[evaHlsConfig]="{ subtitleDisplay: true }"` to restore hls.js's native auto-display behaviour.
- **`EvaDashDirective` — manifest text tracks no longer auto-display**: Same class of bug on the dash.js side — `streaming.text.defaultEnabled` defaults to `true` in dash.js. Now set to `false` by default; override via `[evaDashConfig]="{ streaming: { text: { defaultEnabled: true } } }"`.
- **`EvaFullscreenAPI` not exported from the package entry point**: The service was documented and injectable within the library, but `public-api.ts` only re-exported `./lib/api/eva-api`, not `./lib/api/fullscreen`, so `import { EvaFullscreenAPI } from 'ez-vid-ang'` failed for consumers building custom fullscreen controls. Added `export * from "./lib/api/fullscreen";` to `public-api.ts`.

## [22.0.7, 21.2.7] - 2026-07-03

### Breaking Changes

- **`EvaOverlayPlay` — `ENDED` state no longer shown by default**: `EvaOverlayPlay` previously showed the play icon when the video reached `EvaState.ENDED`. It now hides in that state by default to allow `<eva-ended-overlay>` to take over without both rendering simultaneously. To restore the previous behaviour, add `[evaShowPlayOnVideoEnding]="true"` to your `<eva-overlay-play>` element.

### Added

- **`EvaEndedOverlay`** (`<eva-ended-overlay>`): New component that covers the full player area when the video reaches `EvaState.ENDED`. Pure content container — all UI is supplied via content projection (`<ng-content />`), giving full control over replay buttons, next-video cards, and any other end-of-video experience. Suppressed automatically when the video has `loop` enabled. Has `role="alert"` and an `evaAria` input for the accessible label. 1 `--eva-ended-overlay-background` CSS variable.
- **`EvaOverlayPlay` — `evaShowPlayOnVideoEnding` input**: New `boolean` input (default `false`). When `false` (the default), the overlay-play icon is hidden when the video is in the `ENDED` state, making room for `<eva-ended-overlay>`. Set to `true` to preserve the original behaviour of showing the play icon on video end.
- **`EvaTooltip` directive** (`evaTooltip`): New directive that shows a floating tooltip above a supported control element on hover and focus. Apply directly in the template to any of: `eva-play-pause`, `eva-backward`, `eva-forward`, `eva-loop`, `eva-picture-in-picture`, `eva-active-chapter`, `eva-mute`, `eva-volume`, `eva-cinema-mode`, `eva-download`, `eva-screenshot`, `eva-track-selector`, `eva-playback-speed`, `eva-quality-selector`, `eva-settings-panel`, `eva-fullscreen`. Label is resolved from the `evaTooltip` input or the host element's `aria-label` automatically — no explicit label required for most controls. Optional `evaTooltipShortcutKey` input displays the bound key from the active `EvaKeyboardShortcutsConfiguration` as a shortcut badge; badge is suppressed automatically when keyboard shortcuts are disabled. Tooltip is appended to `document.body` with `position: fixed`, appears above the host element, and flips below when near the viewport top edge. 13 `--eva-tooltip-*` CSS variables.

### Fixed

- **`EvaApi` — `cue.startTime` nullish coalescing**: `cue.startTime ? cue.startTime : 0` replaced with `cue.startTime ?? 0`. The previous falsy check incorrectly substituted `0` when `startTime` was legitimately `0` (cue at the very start of the video).
- **`EvaApi` — unmute clears `muted` property**: `muteOrUnmuteVideo()` now sets `HTMLVideoElement.muted = false` on the unmute path. Previously only `volume` was restored, leaving the native `muted` flag set when a consumer had muted the element via the `muted` attribute or the `EvaVideoConfigurationDirective`.
- **`validateAndPrepareStartingVideoVolume` — NaN guard**: Added `|| !isFinite(v)` to the existing `v === undefined` check. A `NaN` volume (e.g. from parsing an invalid localStorage string) previously passed validation and was assigned directly to `HTMLVideoElement.volume`, which the browser silently ignores.

### Documentation

- **`documentation/controls/ended-overlay.md`**: New file. Documents `EvaEndedOverlay` selector, inputs, visibility behaviour, content projection patterns, animation, SCSS variables, and the `EvaEndedOverlayAria` type.
- **`documentation/core/directives.md`**: Added `EvaTooltip` section. Documents supported selectors, inputs, label resolution order, shortcut badge behaviour, `EvaTooltipShortcutKey` type, all 13 SCSS variables, and positioning logic.
- **`documentation/controls/overlay-play.md`**: Added `evaShowPlayOnVideoEnding` to the inputs table. Updated Visibility section to reflect that `ENDED` is excluded by default.
- **`documentation/controls/playback-speed.md`**: Added missing `evaDefaultPlaybackSpeed` input to the inputs table.
- **`documentation/example-configuration.md`**: Added `<eva-ended-overlay>` with a replay handler, `EvaTooltip` directive on all eligible controls with matching `evaTooltipShortcutKey` bindings, `EvaEndedOverlay` and `EvaTooltip` to the component imports.

---

## [22.0.6, 21.2.6] - 2026-07-01

### Breaking Changes

- **Icon font removed**: `assets/eva-icons-and-fonts.scss` and `assets/videogular.woff` have been deleted. Remove both from the `styles` array in your `angular.json`. Only `eva-required-import.scss` is still required.
- **Icon registration required**: Built-in icons are no longer bundled automatically. Call `addEvaIcons()` once before your components render (e.g. in `main.ts`). Without registration, components render no icon.
- **Host icon classes removed**: `[class.eva-icon]`, `[class.eva-icon-pause]`, `[class.eva-icon-play_arrow]`, `[class.eva-icon-forward_10]`, `[class.eva-icon-forward_30]`, `[class.eva-icon-replay_10]`, `[class.eva-icon-replay_30]`, `[class.eva-icon-volume_up]`, `[class.eva-icon-volume_middle]`, `[class.eva-icon-volume_low]`, `[class.eva-icon-volume_off]` are no longer applied to any host element. Consumer CSS targeting these classes must be updated.
- **`EvaCinemaMode` is now a pure state toggle**: The component no longer touches the `<eva-player>` DOM in any way — it no longer adds/removes the `eva-cinema-mode` CSS class, no longer appends a backdrop `<div>` to `document.body`, and no longer performs any cleanup on `ngOnDestroy`. It only updates `EvaApi.cinemaModeSubject` and emits `evaCinemaToggled`. All layout changes, CSS class bindings, and backdrop effects are now the consumer's responsibility. The component should be placed inside `<eva-controls-container>`, not with overlays.

### Added

- **SVG Icon Registry**: New module-level `Map<string, string>` that stores SVG strings keyed by name. All built-in icons use `fill="currentColor"` so they inherit the component's CSS `color` property.
  - **`addEvaIcons(icons)`**: New public function. Accepts a `Record<string, string>` of icon export names to SVG strings. Converts camelCase export names to kebab-case registry keys (e.g. `evaForward10Icon` → `forward-10`). Call once at startup. Safe to call multiple times.
  - **`getEvaIcon(name)`**: New internal function used by the `EvaIcon` component to look up an SVG string by registry key.
- **`EvaIcon` component** (`<eva-icon>`): New internal component exported from the public API. Accepts a `name` input (required), looks up the SVG from the registry, and injects it as trusted HTML via `DomSanitizer.bypassSecurityTrustHtml()`. Both the host element and the inner `<span>` use `display: contents` so the SVG participates in the parent's layout as if it were a direct child.
- **`ez-vid-ang/icons` secondary entry point**: New tree-shakable package entry with 19 individual SVG icon constants and an `evaAllIcons` barrel object for convenience registration. Constants: `evaPlayIcon`, `evaPauseIcon`, `evaForward10Icon`, `evaForward30Icon`, `evaBackward10Icon`, `evaBackward30Icon`, `evaVolumeHighIcon`, `evaVolumeMediumIcon`, `evaVolumeLowIcon`, `evaVolumeMuteIcon`, `evaFullscreenIcon`, `evaFullscreenExitIcon`, `evaCinemaModeIcon`, `evaLoopIcon`, `evaPictureInPictureIcon`, `evaRemotePlaybackIcon`, `evaDownloadIcon`, `evaScreenshotIcon`, `evaSettingsIcon`.
- **`EvaSettingsPanel` — `evaCustomIcon` input**: New `boolean` input (default `false`). When `true`, suppresses the registry-sourced gear icon and renders projected content instead, consistent with all other icon-bearing components.

### Changed

- **Icon rendering — all control components**: The icon font CSS class approach has been replaced with the SVG registry across all 11 icon-bearing components. Each now imports and uses `<eva-icon name="...">` in its template instead of CSS class bindings on the host element.
  - `EvaPlayPause`: Registry keys `play` / `pause` (conditioned on playback state).
  - `EvaMute`: Registry keys `volume-high` / `volume-medium` / `volume-low` / `volume-mute` (conditioned on volume thresholds).
  - `EvaForward`: Registry key `forward-10` or `forward-30` (conditioned on `evaForwardSeconds`).
  - `EvaBackward`: Registry key `backward-10` or `backward-30` (conditioned on `evaBackwardSeconds`).
  - `EvaFullscreen`: Registry key `fullscreen` / `fullscreen-exit` (conditioned on fullscreen state).
  - `EvaOverlayPlay`: Registry key `play`.
  - `EvaCinemaMode`: Registry key `cinema-mode` (replaces previous inline SVG).
  - `EvaLoop`: Registry key `loop` (replaces previous inline SVG).
  - `EvaPictureInPicture`: Registry key `picture-in-picture` (replaces previous inline SVG).
  - `EvaRemotePlayback`: Registry key `remote-playback` (replaces previous inline SVG). Connecting/connected state styles moved from `> svg` child selectors to `:host` level, since the SVG inherits color via `currentColor`.
  - `EvaDownload`: Registry key `download` (replaces previous inline SVG).
  - `EvaScreenshot`: Registry key `screenshot` (replaces previous inline SVG).
  - `EvaSettingsPanel`: Registry key `settings` (replaces previous inline stroke SVG with a `fill="currentColor"` Material Design gear icon for consistency with the registry pattern).
- **`EvaTrackSelector`**: Removed `[class.eva-icon]: "true"` host binding. The icon font base class was providing layout rules (`display: inline-flex`, `width`, `font-size`) that are already declared in the component's own `:host` SCSS — removing the binding has no visual effect.
- **`evaCustomIcon` input description** (all components): Updated to accurately reflect the new behaviour — "suppresses the registry-sourced icon and renders `<ng-content>` instead" — replacing the stale reference to "built-in icon classes".

### Removed

- **`assets/eva-icons-and-fonts.scss`**: Deleted. The icon font utility classes (`eva-icon`, `eva-icon-*`) and `@font-face` declaration for `videogular.woff` are no longer part of the library.
- **`assets/videogular.woff`**: Deleted. Material Icons subset font file no longer loaded or distributed.
- **`.eva-cinema-backdrop`**: Removed from `eva-required-import.scss`, along with the `eva-cinema-backdrop-fade-in` keyframes and the `--eva-cinema-backdrop-z-index` / `--eva-cinema-backdrop-background` CSS variables. `EvaCinemaMode` no longer creates this element (see Breaking Changes).

### Documentation
- **`AI_INSTRUCTIONS.md`**: New file at repo root. Copy/paste reference for AI coding assistants (Claude, Cursor, Copilot, etc.) working in projects that consume `ez-vid-ang` — covers required setup steps, the standalone composition model, a full selector/input/output reference for every exported component and directive, the icon registry table, and common-mistake rules to prevent hallucinated APIs.
- **`README.md`**: Removed `eva-icons-and-fonts.scss` from the `angular.json` setup snippet. Replaced the NOTE about the optional font file with icon registration instructions (`addEvaIcons(evaAllIcons)` and a tree-shaking example).
- **`documentation/example-simple.md`**: Added `addEvaIcons` import and registration call for the icons used in the simple player.
- **`documentation/example-configuration.md`**: Added `addEvaIcons(evaAllIcons)` registration at the top of the TypeScript block. Moved `<eva-cinema-mode>` from the overlays section into `<eva-controls-container>`.
- **`documentation/controls/play-pause.md`**: Renamed "Icon States" → "Icon Registry Keys". Replaced CSS class names with registry keys. Added `addEvaIcons` snippet.
- **`documentation/controls/mute.md`**: Renamed "Icon States" → "Icon Registry Keys". Replaced CSS class names with registry keys. Added `addEvaIcons` snippet.
- **`documentation/controls/forward.md`**: Removed icon-related host binding rows. Renamed "Icon Classes" → "Icon Registry Keys" with updated key names. Added `addEvaIcons` snippet.
- **`documentation/controls/backward.md`**: Corrected all `evaForwardSeconds` references to `evaBackwardSeconds` (the actual input name). Renamed "Icon Classes" → "Icon Registry Keys" with updated key names. Added `addEvaIcons` snippet.
- **`documentation/controls/fullscreen.md`**: Added "Icon Registry Keys" section. Added `addEvaIcons` snippet.
- **`documentation/controls/overlay-play.md`**: Added "Icon Registry Keys" section. Added `addEvaIcons` snippet.
- **`documentation/controls/cinema-mode.md`**: Rewritten — removed all references to the component managing CSS classes or DOM. Updated placement guidance (controls bar, not overlays), updated consumer CSS and settings-panel examples to reflect full consumer ownership of layout and state.
- **`documentation/controls/loop.md`**: Added "Icon Registry Keys" section. Added `addEvaIcons` snippet.
- **`documentation/controls/picture-in-picture.md`**: Added "Icon Registry Keys" section. Added `addEvaIcons` snippet.
- **`documentation/controls/remote-playback.md`**: Added "Icon Registry Keys" section. Added `addEvaIcons` snippet.
- **`documentation/controls/download.md`**: Added "Icon Registry Keys" section. Added `addEvaIcons` snippet.
- **`documentation/controls/screenshot.md`**: Added "Icon Registry Keys" section. Added `addEvaIcons` snippet.
- **`documentation/controls/settings-panel.md`**: Added `evaCustomIcon` to the inputs table. Added "Icon Registry Keys" section with `evaSettingsIcon` registration and custom icon projection example.


---

## [22.0.5, 21.2.5] - 2026-06-29

### Added

- **`EvaRemotePlayback`**: New remote playback (Cast/AirPlay) toggle button. Uses the W3C Remote Playback API (`video.remote`) for Chrome/Chromium and falls back to `webkitShowPlaybackTargetPicker()` for Safari AirPlay. Auto-hides when no devices are available. Monitors device availability in real time via `watchAvailability()`. Three connection states: `disconnected`, `connecting`, `connected`. Pulsing animation while connecting, color change when connected. Registers a prompt callback with `EvaApi` for settings panel and context menu integration. Built-in cast icon. 2 `--eva-remote-playback-*` CSS variables.
- **`EvaApi.remotePlaybackStateSubject`**: New `BehaviorSubject` that broadcasts the remote playback connection state (`'disconnected' | 'connecting' | 'connected'`).
- **`EvaApi.promptRemotePlayback()`**: New method that opens the browser's remote playback device picker. Delegates to the registered `EvaRemotePlayback` component.
- **`EvaApi.registerRemotePlaybackPrompt()`**: New method for `EvaRemotePlayback` to register its prompt callback.
- **`EvaRemotePlaybackState`**: New type for remote playback connection states.
- **`EvaRemotePlaybackAria`**: New ARIA type with transform.
- **`EvaScrubBar` — Thumbnail Preview**: New `evaThumbnailVtt` input. Accepts a VTT sprite sheet URL and shows thumbnail previews on scrub bar hover. Parses `#xywh=x,y,w,h` fragments. Sprite images are preloaded after parsing. Thumbnails are edge-clamped to stay within the scrub bar. Hover updates coalesced via `requestAnimationFrame` for performance. Fade-in animation and `will-change` GPU hint. Supports runtime VTT URL changes with `AbortController` fetch cancellation. Validates all cue data: rejects negative coords, zero dimensions, inverted time ranges, and missing sprite fragments. 3 `--eva-scrub-bar-thumbnail-*` CSS variables.
- **`EvaThumbnailCue`**: New type for parsed VTT thumbnail cues.
- **`HALF_DIVISOR`**, **`VTT_XYWH_COORDS_LENGTH`**, **`VTT_XYWH_PREFIX_LENGTH`**, **`VTT_TIMESTAMP_MIN_PARTS`**, **`VTT_TIMESTAMP_MAX_PARTS`**, **`VTT_MS_PAD_LENGTH`**, **`MS_PER_SECOND`**: New constants.

### Documentation

- New: `documentation/controls/remote-playback.md` — full documentation with browser support table, EvaApi integration, and settings panel integration example.
- Updated: `documentation/controls/scrub-bar.md` — added Thumbnail Preview section with VTT format, validation table, runtime behaviour, and SCSS variables.
- Updated: `documentation/example-configuration.md` — added remote playback and thumbnail VTT to the full example.
- Updated: Added JSDoc to all previously undocumented methods, fields, signals, and utility functions across the entire codebase (`eva-api.ts`, `fullscreen.ts`, `player.ts`, `video-configuration.ts`, `utilities.ts`, `settings-panel.ts`).

---

## [22.0.4, 21.2.4] - 2026-06-28

### Added

- **`EvaDownload`**: New download button component. Emits `EvaDownloadEvent` with `currentSrc`, `currentTime`, and `duration` on click — consumer handles the download logic. Supports custom icons via content projection. Built-in SVG download icon.
- **`EvaScreenshot`**: New screenshot button component. Captures the current video frame via `EvaApi.captureScreenshot()` and emits `EvaScreenshotEvent` with `Blob`, data URL, timestamp, and frame dimensions. Configurable image format (`image/png`, `image/jpeg`, `image/webp`) and quality. Cross-origin tainted canvas emits `null` instead of throwing. Built-in SVG camera icon.
- **`EvaApi.captureScreenshot()`**: New async method that draws the current video frame to an offscreen canvas. Can be called programmatically (e.g. from a context menu action) without the `EvaScreenshot` component.
- **`EvaContextMenu`**: New custom context menu component. Replaces the browser's right-click menu on the player with a branded dropdown. Positioned at cursor, clamped within player bounds. Supports menu items, dividers, and disabled items. Animated open/close (scale + opacity). Closes on item click, outside click, Escape, or second right-click. Emits `EvaContextMenuEvent` with item ID and current video state. 13 `--eva-context-menu-*` CSS variables.
- **`EvaErrorOverlay`**: New error overlay component. Shows automatically when `EvaState.ERROR` fires. Displays configurable error message and retry button. Retry calls `videoElement.load()` and emits `evaRetryClicked`. Supports full content projection via `evaCustomContent`. 17 `--eva-error-overlay-*` CSS variables. `role="alert"` for screen reader announcement.
- **`EvaCinemaMode`**: New cinema mode toggle button. Adds `eva-cinema-mode` class to the parent `<eva-player>` and injects a backdrop overlay into `document.body`. Consumer CSS controls the layout change. Backdrop click exits cinema mode. Auto-deactivates on destroy. Animated backdrop with `--eva-cinema-backdrop-*` CSS variables.
- **`EvaApi.cinemaModeSubject`**: New `BehaviorSubject<boolean>` that broadcasts the cinema mode state. Used by `EvaCinemaMode` and `ConfigurationStorage`.
- **Configuration Storage**: New feature that persists user preferences to `localStorage`:
  - `ConfigurationStorage` directive applied on the `<video>` element, managed via `EvaPlayer` inputs.
  - `EvaConfigurationStorage` service with read/write methods for volume, playback speed, cinema mode, and loop.
  - `evaLocalStorageEnabled` input — master toggle.
  - `evaLocalStorageKey` input — key prefix for multi-player isolation.
  - `evaLocalStorageConfiguration` input — granular flags (`{ volume, playbackSpeed, cinemaMode, loop }`), toggleable at runtime.
  - Saved values restored on player init, overriding config defaults (user's last choice wins).
  - Volume `0` (muted) not persisted. All `localStorage` access wrapped in try-catch.
- **`EvaApi`**: Now exported from the public API for direct consumer access to player methods (e.g. `setPlaybackSpeed()`, `captureScreenshot()`, `cinemaModeSubject`).
- **`EvaSettingsPanel`**: New YouTube-style settings panel component. Gear icon button in the control bar that opens a navigable dropdown menu. Items with `options` navigate into a sub-menu with back button; items without `options` emit directly. Animated height transitions between main menu and sub-menus. Dynamic position clamping within the player boundary (prevents overflow on left/right placement). Sub-menu selection returns to main menu instead of closing. Stateless design — consumer provides `EvaSettingsMenuItem[]` and handles `EvaSettingsMenuEvent` output. Full keyboard navigation (Arrow keys, Enter/Space, Home/End, Escape). 30+ `--eva-settings-panel-*` CSS variables.
- **`EvaKeyboardShortcutsOverlay`**: New keyboard shortcuts overlay component. Centered panel listing all configured keyboard shortcuts, grouped by category (Playback, Seeking, Media). Integrated with the `EvaKeyboardShortcuts` directive — toggled automatically via `?` key. Reads open state and configuration from `EvaApi` — zero-configuration usage (`<eva-keyboard-shortcuts-overlay />`). Key labels auto-formatted for display (`ARROWLEFT` → `←`, `SPACE` → `Space`). Closes on Escape, click outside, or close button. Tree-shakable. 20+ `--eva-shortcuts-overlay-*` CSS variables.
- **`EvaApi.keyboardShortcutsOverlaySubject`**: New `BehaviorSubject<boolean>` that broadcasts the keyboard shortcuts overlay open/close state. Toggled by `EvaKeyboardShortcuts` on `?` key press.
- **`EvaApi.keyboardShortcutsConfigSubject`**: New `BehaviorSubject` that holds the resolved keyboard shortcuts configuration. Published by `EvaKeyboardShortcuts` on init.
- **`EvaKeyboardShortcuts`**: Now handles `?` key to toggle the keyboard shortcuts overlay. Publishes the resolved configuration to `EvaApi.keyboardShortcutsConfigSubject` on init.
- **`EvaSettingsMenuItem`**, **`EvaSettingsMenuOption`**, **`EvaSettingsMenuEvent`**: New types for the settings panel. Optional properties use `| undefined` for `exactOptionalPropertyTypes` compatibility.
- **`EvaSettingsPanelAria`**: New ARIA type with transform.
- **`EvaDownloadEvent`**, **`EvaScreenshotEvent`**, **`EvaContextMenuItem`**, **`EvaContextMenuEvent`**: New types.
- **`EvaDownloadAria`**, **`EvaScreenshotAria`**, **`EvaErrorOverlayAria`**, **`EvaCinemaModeAria`**: New ARIA types with transforms.
- **`HEIGHT_TRANSITION_FALLBACK_MS`**, **`DEFAULT_IMAGE_QUALITY`**, **`DEFAULT_STORAGE_KEY`**: New constants.

### Bug Fixes

- **`EvaApi`**: `updateVideoTime()` set `remaining` to `NaN` when `getVideoDuration()` returned `NaN` (e.g. before metadata loads or during rapid source changes). Added `Number.isFinite()` guard — returns `0` when duration is invalid.
- **`EvaCueChangeDirective`**: Accessed `track` property on the `<track>` element without a null guard in both the reactive `effect()` and `detach()`. Crashes if the `TextTrack` is not yet initialized. Added null check in the effect and optional chaining in `detach()`.
- **`EvaScrubBar`**: `touchEnd()` accessed `assignedVideoElement!.currentTime` without calling `validateVideoAndPlayerBeforeAction()` first. Crashes if the video element is null during a touch seek. Added validation guard.
- **`EvaTrackSelector`**: Rapid track changes in `announceTrackChange()` created orphaned `setTimeout` callbacks and DOM announcement elements without cancelling previous ones. Added `clearTimeout()` before creating a new announcement.
- **`EvaKeyboardShortcuts`**: `toggleFullscreen()` call had no `.catch()` handler, unlike other async calls in the same file. Could cause unhandled promise rejection warnings when the browser rejects fullscreen (e.g. missing user gesture).

### Documentation

- New: `documentation/controls/settings-panel.md` — full documentation with integration examples for all player features (playback speed, quality, loop, cinema mode, screenshot, PiP, download, fullscreen, mute, volume, track selector).
- New: `documentation/controls/keyboard-shortcuts-overlay.md`.
- New: `documentation/controls/download.md`, `documentation/controls/screenshot.md`, `documentation/controls/context-menu.md`, `documentation/controls/error-overlay.md`, `documentation/controls/cinema-mode.md`, `documentation/core/configuration-storage.md`.
- Updated: 14 component docs with "Settings Panel Integration" sections showing how to consolidate each feature into `EvaSettingsPanel`.
- New: `documentation/example-simple.md` — minimal player example with essential controls only.
- Updated: `documentation/example-configuration.md` — rewritten as full-featured example showcasing every component and feature.
- Updated: `eva-api.md` (screenshot section), `player.md` (storage inputs), `directives.md` (storage directive), `constants.md`, `picture-in-picture.md`.

---

## [22.0.2, 21.2.2] - 2026-06-22

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

## [22.0.1, 21.2.1] - 2026-06-21

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
