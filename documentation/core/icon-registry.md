# Icon Registry

The Eva icon registry is a module-level `Map<string, string>` that stores SVG strings keyed by name. Components look up their icon at render time via the registry instead of relying on an icon font or bundled assets — giving you full control over which icons are included in your bundle.

All built-in SVGs use `fill="currentColor"` so icons inherit the component's CSS `color` property automatically.

## Setup

Call `addEvaIcons()` once before your components render — typically in `main.ts` or your app config:

```typescript
import { addEvaIcons } from 'ez-vid-ang';
import { evaAllIcons } from 'ez-vid-ang/icons';

addEvaIcons(evaAllIcons);
```

To minimize bundle size, import only the icons your components use:

```typescript
import { addEvaIcons } from 'ez-vid-ang';
import { evaPlayIcon, evaPauseIcon, evaFullscreenIcon, evaFullscreenExitIcon } from 'ez-vid-ang/icons';

addEvaIcons({ evaPlayIcon, evaPauseIcon, evaFullscreenIcon, evaFullscreenExitIcon });
```

## API

### `addEvaIcons(icons)`

Registers one or more SVG strings into the global registry.

| Parameter | Type | Description |
|---|---|---|
| `icons` | `Record<string, string>` | Map of export names to SVG strings. Keys are camelCase export names (e.g. `evaPlayIcon`); values are SVG strings. |

The function converts each key from the camelCase export name to a kebab-case registry key automatically (`evaForward10Icon` → `forward-10`). Safe to call multiple times — subsequent calls add or overwrite individual entries without clearing others.

### `getEvaIcon(name)`

Internal function used by the `EvaIcon` component to look up a registered SVG by its kebab-case registry key. Not intended for direct consumer use.

### `EvaIcon` component

```html
<eva-icon name="play" />
```

| Input | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | ✅ Yes | Registry key of the icon to render (kebab-case). |

Uses `DomSanitizer.bypassSecurityTrustHtml()` to inject the SVG. Both the host element and the inner `<span>` use `display: contents` so the SVG participates in the parent's layout as a direct child.

## `ez-vid-ang/icons` Entry Point

Import individual icon constants or the full barrel from the secondary entry point:

```typescript
import { evaPlayIcon } from 'ez-vid-ang/icons';       // single icon
import { evaAllIcons } from 'ez-vid-ang/icons';        // all icons
```

## Available Icons

| Export constant | Registry key | Used by | Description |
|---|---|---|---|
| `evaPlayIcon` | `play` | `EvaPlayPause`, `EvaOverlayPlay` | Play arrow |
| `evaPauseIcon` | `pause` | `EvaPlayPause` | Pause bars |
| `evaForward10Icon` | `forward-10` | `EvaForward` | Seek forward 10 s |
| `evaForward30Icon` | `forward-30` | `EvaForward` | Seek forward 30 s |
| `evaBackward10Icon` | `backward-10` | `EvaBackward` | Seek backward 10 s |
| `evaBackward30Icon` | `backward-30` | `EvaBackward` | Seek backward 30 s |
| `evaVolumeHighIcon` | `volume-high` | `EvaMute` | High volume (two arcs) |
| `evaVolumeMediumIcon` | `volume-medium` | `EvaMute` | Medium volume (one arc) |
| `evaVolumeLowIcon` | `volume-low` | `EvaMute` | Low volume (no arc) |
| `evaVolumeMuteIcon` | `volume-mute` | `EvaMute` | Muted (speaker with X) |
| `evaFullscreenIcon` | `fullscreen` | `EvaFullscreen` | Enter fullscreen |
| `evaFullscreenExitIcon` | `fullscreen-exit` | `EvaFullscreen` | Exit fullscreen |
| `evaCinemaModeIcon` | `cinema-mode` | `EvaCinemaMode` | Wide-screen rectangle |
| `evaLoopIcon` | `loop` | `EvaLoop` | Loop arrows |
| `evaPictureInPictureIcon` | `picture-in-picture` | `EvaPictureInPicture` | Picture-in-picture overlay |
| `evaRemotePlaybackIcon` | `remote-playback` | `EvaRemotePlayback` | Cast/remote screen |
| `evaDownloadIcon` | `download` | `EvaDownload` | Download arrow |
| `evaScreenshotIcon` | `screenshot` | `EvaScreenshot` | Camera |
| `evaSettingsIcon` | `settings` | `EvaSettingsPanel` | Gear / settings |

## Custom Icons

You can replace any built-in icon by registering your own SVG under the same key:

```typescript
import { addEvaIcons } from 'ez-vid-ang';

addEvaIcons({
  evaPlayIcon: '<svg ...>...</svg>',
});
```

Or project a custom element directly into any control component via `evaCustomIcon`:

```html
<eva-play-pause [evaCustomIcon]="true">
  <img evaPlay src="assets/play.svg" alt="" />
  <img evaPause src="assets/pause.svg" alt="" />
</eva-play-pause>

<eva-settings-panel [evaCustomIcon]="true" [evaSettingsMenuItems]="items()">
  <img src="assets/gear.svg" alt="" />
</eva-settings-panel>
```

When `evaCustomIcon` is `true`, the registry lookup is skipped entirely and `<ng-content>` is rendered instead. See individual component docs for the content projection selectors each component accepts.

## Key Derivation

`addEvaIcons` derives registry keys from export names by:
1. Stripping the `eva` prefix and `Icon` suffix.
2. Inserting `-` before each uppercase letter that follows a lowercase letter.
3. Inserting `-` at letter-digit and digit-letter boundaries.
4. Converting to lowercase.

Examples: `evaPlayIcon` → `play`, `evaForward10Icon` → `forward-10`, `evaFullscreenExitIcon` → `fullscreen-exit`.
