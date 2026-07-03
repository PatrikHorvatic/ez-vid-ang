# AI Instructions — ez-vid-ang

> Copy this entire file into your AI coding assistant's context (`CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`, `AGENTS.md`, etc.) in any project that consumes the `ez-vid-ang` npm package. It exists so the assistant stops guessing component names, inputs, and setup steps and instead uses the real API surface below.
>
> This file describes how to **consume** the library. It is not the library's own contributor guidelines.

## What this is

`ez-vid-ang` (EzVidAng) is a standalone, signal-based Angular component library for video playback (HTML5, HLS, DASH). Every export is a standalone component/directive — there is no NgModule to import. Version `22.x` targets Angular `~22.0.0`; version `21.x` targets Angular `~21.2.x` (install with the matching dist-tag, see below).

## Mandatory setup — do this before writing any player markup

**1. Install** (unscoped package name — there is no `@ez-vid-ang/*` scope):
```
npm i ez-vid-ang
```

**2. Register the required stylesheet** in `angular.json` (needed for base layout/theming — components will render unstyled without it):
```json
{
  "projects": {
    "your_project": {
      "architect": {
        "build": {
          "options": {
            "styles": ["node_modules/ez-vid-ang/assets/eva-required-import.scss"]
          }
        }
      }
    }
  }
}
```

**3. Register icons once**, before any player renders (e.g. `main.ts` or app bootstrap). Components resolve icons from a runtime registry, not bundled assets — skipping this step renders empty icon slots, not an error:
```typescript
import { addEvaIcons } from 'ez-vid-ang';
import { evaAllIcons } from 'ez-vid-ang/icons';

addEvaIcons(evaAllIcons);
```
To reduce bundle size, register only the icons actually used instead of `evaAllIcons` (see icon table below for exact export names).

**4. Optional — only if using `evaHls` or `evaDash` directives:**
```
npm i hls.js     # for evaHls
npm i dashjs      # for evaDash (v5)
```
Then add the script to `angular.json` → `architect.build.options.scripts`:
- HLS: `node_modules/hls.js/dist/hls.min.js`
- DASH: `node_modules/dashjs/dist/modern/esm/dash.all.min.js`

## Composition model

- `<eva-player>` is the single required root element. Everything else (controls, overlays, scrub bar) is content-projected as its children — there is no separate "controls module."
- Every component/directive used in a template must be added to the host `@Component`'s `imports` array (all standalone, no NgModule exists to import instead).
- All components are `ChangeDetectionStrategy.OnPush` and signal-driven. Pass signals/plain values as inputs — do not expect zone-triggered change detection.
- Multiple independent `<eva-player>` instances can coexist on one page; each gets its own scoped `EvaApi` and `EvaFullscreenAPI` (provided at the component level), so state never leaks between players.
- To reach the imperative API (`captureScreenshot()`, `setPlaybackSpeed()`, subjects like `pictureInPictureSubject`, etc.), grab a `viewChild` reference to `EvaPlayer` and read `.playerMainAPI`:
  ```typescript
  private readonly player = viewChild.required<EvaPlayer>('playerRef');
  private get api(): EvaApi { return this.player().playerMainAPI; }
  ```

## Minimal working example

```html
<eva-player #player id="simple" [evaVideoSources]="sources()" [evaKeyboardShortcutsEnabled]="true">
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
  EvaBuffering, EvaControlsContainer, EvaControlsDivider, EvaErrorOverlay, EvaFullscreen,
  EvaMute, EvaOverlayPlay, EvaPlayer, EvaPlayPause, EvaScrubBar, EvaScrubBarBufferingTime,
  EvaScrubBarCurrentTime, EvaTimeDisplay, EvaUserInteractionEventsDirective, EvaVideoSource, EvaVolume,
} from 'ez-vid-ang';

@Component({
  selector: 'app-simple-player',
  templateUrl: './simple-player.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EvaBuffering, EvaControlsContainer, EvaControlsDivider, EvaErrorOverlay, EvaFullscreen,
    EvaMute, EvaOverlayPlay, EvaPlayer, EvaPlayPause, EvaScrubBar, EvaScrubBarBufferingTime,
    EvaScrubBarCurrentTime, EvaTimeDisplay, EvaUserInteractionEventsDirective, EvaVolume,
  ],
})
export class SimplePlayerComponent {
  protected readonly sources = signal<EvaVideoSource[]>([{ type: 'video/mp4', src: '/video.mp4' }]);
}
```

For every feature combined (HLS, chapters, subtitles, settings panel, context menu, download, screenshot, localStorage persistence, DRM, etc.), read `documentation/example-configuration.md` in the library repo — it is a complete, working reference, not a snippet.

## Component & directive reference

Selector and class must match exactly — do not invent alternate names (e.g. it is `eva-play-pause` / `EvaPlayPause`, never `eva-play` or `EvaPlayButton`). `input.required` means the template will fail to compile without it.

| Selector | Class | Required inputs | Key outputs | Purpose |
|---|---|---|---|---|
| `eva-player` | `EvaPlayer` | `id`, `evaVideoSources` | — | Root host; owns the native `<video>`, `EvaApi`, `EvaFullscreenAPI`. |
| `eva-player[evaHls]` | `EvaHlsDirective` | `evaHlsSrc` | — | HLS streaming via hls.js. `exportAs="evaHls"`. Requires `npm i hls.js`. |
| `eva-player[evaDash]` | `EvaDashDirective` | `evaDashSrc` | — | DASH streaming via dash.js. `exportAs="evaDash"`. Requires `npm i dashjs`. |
| `eva-controls-container` | `EvaControlsContainer` | — | — | Wraps the control bar; `evaAutohide` + `evaAutohideTime` control hiding. |
| `eva-controls-container[evaUserInteractionEvents]` | `EvaUserInteractionEventsDirective` | — | — | Attribute directive on the container; required for autohide to react to mouse/touch/click, and drives dblclick-to-fullscreen. |
| `eva-controls-divider` | `EvaControlsDivider` | — | — | Visual/flex divider between control groups (e.g. push right-aligned controls). |
| `eva-play-pause` | `EvaPlayPause` | — | `playingStateChanged` | Play/pause toggle button. |
| `eva-overlay-play` | `EvaOverlayPlay` | — | — | Large centered play button shown before first playback and on pause/error. By default **not** shown in the `ENDED` state — set `[evaShowPlayOnVideoEnding]="true"` only when not using `<eva-ended-overlay>` (the two are mutually exclusive for the `ENDED` state). |
| `eva-ended-overlay` | `EvaEndedOverlay` | — | — | Full-area overlay shown when video reaches `EvaState.ENDED`. All visible content is consumer-projected via `<ng-content>` — project a replay button, end card, etc. Auto-suppressed when `video.loop` is `true`. Do not combine with `[evaShowPlayOnVideoEnding]="true"` on `EvaOverlayPlay`. |
| `eva-backward` | `EvaBackward` | — | — | Seek backward button (10s/30s icon variants). |
| `eva-forward` | `EvaForward` | — | — | Seek forward button (10s/30s icon variants). |
| `eva-loop` | `EvaLoop` | — | — | Toggles `video.loop`. |
| `eva-mute` | `EvaMute` | — | — | Mute/unmute toggle with volume-level icon. |
| `eva-volume` | `EvaVolume` | — | — | Volume slider. |
| `eva-time-display` | `EvaTimeDisplay` | `evaTimeProperty` (`"current"\|"total"\|"remaining"`), `evaTimeFormating` (`"HH:mm:ss"\|"mm:ss"\|"ss"`) | — | Renders a formatted time value. |
| `eva-scrub-bar` | `EvaScrubBar` | — | — | Seek bar; supports `evaShowChapters`, `evaChapters`, `evaThumbnailVtt`, `hideWithControlsContainer`. |
| `eva-scrub-bar-buffering-time` | `EvaScrubBarBufferingTime` | — | — | Child of `eva-scrub-bar`; renders the buffered range. |
| `eva-scrub-bar-current-time` | `EvaScrubBarCurrentTime` | — | — | Child of `eva-scrub-bar`; renders the playhead. |
| `eva-buffering` | `EvaBuffering` | — | — | Loading/buffering spinner overlay. |
| `eva-error-overlay` | `EvaErrorOverlay` | — | `evaRetryClicked` | Shown on playback error; emits on retry click. |
| `eva-fullscreen` | `EvaFullscreen` | — | — | Fullscreen toggle button. |
| `eva-cinema-mode` | `EvaCinemaMode` | — | `evaCinemaToggled` | Toggles an `eva-cinema-mode` class on the parent `<eva-player>`; pure state, no layout/backdrop of its own — consumer CSS decides what it looks like. |
| `eva-picture-in-picture` | `EvaPictureInPicture` | — | — | PiP toggle button. |
| `eva-remote-playback` | `EvaRemotePlayback` | — | `evaRemotePlaybackStateChanged` | Chromecast/AirPlay button; auto-hides when no devices are available. |
| `eva-playback-speed` | `EvaPlaybackSpeed` | `evaPlaybackSpeeds` (`number[]`) | — | Playback-speed selector dropdown. Optional: `evaDefaultPlaybackSpeed` (default `1`) pre-selects a speed on first render — must be a value present in `evaPlaybackSpeeds` after validation; if not found, no option is pre-selected. |
| `eva-quality-selector` | `EvaQualitySelector` | — | — | Quality/bitrate dropdown; auto-populated by `evaHls`/`evaDash` via `EvaApi`. No manual wiring needed. |
| `eva-track-selector` | `EvaTrackSelector` | — | — | Subtitle/caption track dropdown, built from `evaVideoTracks` on `eva-player`. |
| `eva-subtitle-display` | `EvaSubtitleDisplay` | — | — | Renders the active subtitle cue text. |
| `eva-download` | `EvaDownload` | — | `evaDownloadClicked` | Download button; caller handles the actual download in the output handler. |
| `eva-screenshot` | `EvaScreenshot` | — | `evaScreenshotCaptured` | Captures current frame; also callable directly via `EvaApi.captureScreenshot()`. |
| `eva-context-menu` | `EvaContextMenu` | `evaMenuItems` | `evaMenuItemClicked` | Custom right-click menu. |
| `eva-settings-panel` | `EvaSettingsPanel` | `evaSettingsMenuItems` | `evaSettingsMenuItemSelected` | YouTube-style nested settings menu; caller owns the menu state/items. |
| `eva-keyboard-shortcuts-overlay` | `EvaKeyboardShortcutsOverlay` | — | — | Shortcut cheat-sheet overlay, opened via `EvaApi.keyboardShortcutsOverlaySubject`. |
| `eva-chapter-list` | `EvaChapterList` | — | `evaChapterListClose` | Chapter list panel; controlled via `evaChapterListOpen` input. |
| `eva-active-chapter` | `EvaActiveChapter` | — | `evaChapterClicked` | Shows the chapter title active at the current time. |
| `eva-icon` | `EvaIcon` | `name` (registry key) | — | Renders a registered SVG icon by kebab-case key. |
| `eva-play-pause[evaTooltip]`…(any of the 16 Eva control elements) | `EvaTooltip` | — | — | Floating tooltip directive. Add the `evaTooltip` attribute (optional label string) to any supported Eva control element inside `<eva-controls-container>`. When `evaTooltip` is empty, the label is read from the element's `aria-label`. Add `evaTooltipShortcutKey` (a `keyof EvaKeyboardShortcutsConfiguration` string, e.g. `"playPause"`, `"muteKey"`, `"fullscreen"`) to show a keyboard-shortcut badge — badge is auto-suppressed when shortcuts are disabled. Must be added to the consuming component's `imports` array. Supported elements: `eva-play-pause`, `eva-backward`, `eva-forward`, `eva-loop`, `eva-picture-in-picture`, `eva-active-chapter`, `eva-mute`, `eva-volume`, `eva-cinema-mode`, `eva-download`, `eva-screenshot`, `eva-track-selector`, `eva-playback-speed`, `eva-quality-selector`, `eva-settings-panel`, `eva-fullscreen`. |
| `[evaVideoConfiguration]` | `EvaVideoConfigurationDirective` | `evaVideoConfig` | `videoConfigurationDone` | Internal — configured via `evaVideoConfiguration` input on `eva-player`, not applied directly by consumers. |
| `[evaKeyboardShortcuts]` | `EvaKeyboardShortcuts` | `evaKeyboardShortcutsEnabled`, `evaKeyboardShortcutsConfiguration` | — | Internal — configured via the same-named inputs on `eva-player`. |
| `[evaConfigurationStorage]` | `ConfigurationStorage` | `evaLocalStorageEnabled`, `evaLocalStorageConfiguration` | — | Internal — configured via the same-named inputs on `eva-player`. |

Directives marked "internal" are applied by the library itself inside `eva-player`'s template — consumers configure them purely through inputs on `<eva-player>` (`evaVideoConfiguration`, `evaKeyboardShortcutsEnabled`, `evaLocalStorageEnabled`, etc.), never by adding the attribute selector directly.

## Icon reference

Only register icons you actually use (smaller bundle) via `addEvaIcons({ ... })`, importing from `ez-vid-ang/icons`:

| Export | Registry key | Used by |
|---|---|---|
| `evaPlayIcon` | `play` | `EvaPlayPause`, `EvaOverlayPlay` |
| `evaPauseIcon` | `pause` | `EvaPlayPause` |
| `evaForward10Icon` / `evaForward30Icon` | `forward-10` / `forward-30` | `EvaForward` |
| `evaBackward10Icon` / `evaBackward30Icon` | `backward-10` / `backward-30` | `EvaBackward` |
| `evaVolumeHighIcon` / `evaVolumeMediumIcon` / `evaVolumeLowIcon` / `evaVolumeMuteIcon` | `volume-high` / `volume-medium` / `volume-low` / `volume-mute` | `EvaMute` |
| `evaFullscreenIcon` / `evaFullscreenExitIcon` | `fullscreen` / `fullscreen-exit` | `EvaFullscreen` |
| `evaCinemaModeIcon` | `cinema-mode` | `EvaCinemaMode` |
| `evaLoopIcon` | `loop` | `EvaLoop` |
| `evaPictureInPictureIcon` | `picture-in-picture` | `EvaPictureInPicture` |
| `evaRemotePlaybackIcon` | `remote-playback` | `EvaRemotePlayback` |
| `evaDownloadIcon` | `download` | `EvaDownload` |
| `evaScreenshotIcon` | `screenshot` | `EvaScreenshot` |
| `evaSettingsIcon` | `settings` | `EvaSettingsPanel` |

To use a custom icon instead of the registry, set `[evaCustomIcon]="true"` on the component and project the replacement via `ng-content` (selectors documented per-component), e.g. `<eva-play-pause [evaCustomIcon]="true"><img evaPlay .../><img evaPause .../></eva-play-pause>`.

## Hard rules for the assistant

- Never suggest `NgModule`, `CommonModule` imports, or `*ngIf`/`*ngFor` for this library's own templates — every export is standalone; add it directly to the consuming component's `imports` array.
- Never invent a scoped package name. It is `ez-vid-ang`, not `@ez-vid-ang/ez-vid-ang` or similar.
- `eva-player` always needs both `id` and `evaVideoSources`, even when using `evaHls`/`evaDash` (pass `[evaVideoSources]="[]"` when streaming exclusively).
- Do not call `addEvaIcons` per-component or per-render — it's a one-time global registration, call it once at bootstrap.
- Quality switching (`eva-quality-selector`) needs no manual wiring when `evaHls`/`evaDash` is present — it is populated automatically through `EvaApi`. Do not wire it manually.
- `eva-scrub-bar-buffering-time` / `eva-scrub-bar-current-time` must be children of `eva-scrub-bar`, not siblings.
- For imperative control (screenshot, playback speed, volume, PiP, quality), prefer `EvaApi` methods via a `viewChild` reference over manipulating the native `<video>` element directly.
- HLS/DASH are peer installs, not bundled — code using `evaHls`/`evaDash` must also instruct the user to `npm i hls.js` / `npm i dashjs` and register the script in `angular.json`.
- Do not use `<eva-ended-overlay>` together with `[evaShowPlayOnVideoEnding]="true"` on `<eva-overlay-play>` — they are mutually exclusive affordances for the `ENDED` state. Use one or the other, not both.
- `EvaTooltip` only activates on the 16 specific Eva control elements listed in the component table. Applying `evaTooltip` to any other element (including arbitrary HTML) has no effect.

## Authoritative docs

This table is a quick-reference, not the full spec. For exact inputs/outputs/types on any single component, read its dedicated file in the library's own repo before writing non-trivial usage:
- `documentation/core/` — player, EvaApi, directives, icon registry, configuration storage, fullscreen API
- `documentation/controls/` — one file per control component
- `documentation/buffering/`, `documentation/streaming/` — buffering indicator, HLS/DASH directives
- `documentation/example-simple.md`, `documentation/example-configuration.md` — full working examples
