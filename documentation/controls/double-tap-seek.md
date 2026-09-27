## EvaDoubleTapSeek

Double-tap-to-seek gesture zones for touch devices — the standard mobile UX popularized by YouTube and Netflix. Renders two invisible zones over the left and right halves of the video. Tapping twice in quick succession seeks backward (left) or forward (right) by `evaDoubleTapSeekSeconds`, showing a brief ripple flash and a `-10s`/`+10s` label. Tapping again within the same window accumulates: `-10s`, then `-20s`, and so on.

**Touch-only by design.** The zones only intercept pointer input on touch-primary devices (`@media (hover: none) and (pointer: coarse)`) — on mouse/trackpad devices they never capture clicks, so `<eva-overlay-play>`'s own click-to-toggle-play behavior is completely unaffected on desktop.

**A single tap toggles play/pause.** A tap has to be intercepted (and its default behavior prevented) before it's known whether a second tap will follow shortly after — both to tell a single tap apart from a double tap, and to suppress iOS Safari's native double-tap-to-zoom. Because of this, a confirmed single tap can't simply be allowed to fall through as a native click to whatever is underneath (typically `<eva-overlay-play>`); instead it calls `EvaApi.playOrPauseVideo()` directly — the same action `<eva-overlay-play>`'s click already performs. Combining both components on touch therefore keeps the exact same single-tap behavior, with double-tap-seek layered on top.

**Works identically with `EvaHlsDirective`/`EvaDashDirective`.** Seeking is delegated to `EvaApi.seekBack()`/`seekForward()` — the same methods `<eva-backward>`/`<eva-forward>` and keyboard shortcuts use. These operate on the native `HTMLVideoElement.currentTime` directly, which hls.js/dash.js also drive under the hood, so no streaming-specific handling is needed.

**Accessible by omission.** The component is marked `aria-hidden` and not focusable. Equivalent functionality (`<eva-backward>`/`<eva-forward>`, `<eva-play-pause>`, keyboard shortcuts) remains fully available to assistive technology through those existing, purpose-built components — this is a supplementary touch convenience layer, not a replacement for them.

### Selector

```html
<eva-double-tap-seek />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaDoubleTapSeekSeconds` | `number` | No | `10` | Seconds to seek per tap (and per additional accumulated tap). Also selects the ripple icon: `30` → `backward-30`/`forward-30`, anything else (including the `10` default) → `backward-10`/`forward-10`. Validated via the same validator `<eva-backward>`/`<eva-forward>` use. |
| `evaSeekBackwardLabel` | `(seconds: number) => string` | No | `(seconds) => \`-${seconds}s\`` | Formats the backward-seek ripple label from the accumulated seconds. |
| `evaSeekForwardLabel` | `(seconds: number) => string` | No | `(seconds) => \`+${seconds}s\`` | Formats the forward-seek ripple label from the accumulated seconds. |
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses the registry-sourced icons and renders `<ng-content>` instead, using the `evaSeekBackward`/`evaSeekForward` content selectors. |
| `evaRippleDurationMs` | `number` | No | `600` | How long a tap ripple flash stays on screen, in milliseconds. Drives both the removal timer and the `--eva-double-tap-ripple-duration` CSS animation duration for this instance. Negative values are clamped to `0`. |
| `evaRippleEnabled` | `boolean` | No | `true` | Whether the ripple flash is shown on a double-tap seek. The `-10s`/`+10s` label and the seek itself are unaffected — only the background flash is toggled. Can be changed at runtime. |

### Icon Registry Keys

The ripple label uses the same `backward-10`/`backward-30`/`forward-10`/`forward-30` registry keys as `<eva-backward>`/`<eva-forward>`. Register whichever pair matches your configured `evaDoubleTapSeekSeconds` before using the component:

```typescript
import { addEvaIcons } from 'ez-vid-ang';
import { evaBackward10Icon, evaForward10Icon } from 'ez-vid-ang/icons';
addEvaIcons({ evaBackward10Icon, evaForward10Icon });
```

### Usage

```html
<!-- Minimal usage — alongside eva-overlay-play, inside <eva-player> -->
<eva-overlay-play />
<eva-double-tap-seek />

<!-- Custom seek amount -->
<eva-double-tap-seek [evaDoubleTapSeekSeconds]="30" />

<!-- Custom labels (e.g. localization) -->
<eva-double-tap-seek
  [evaSeekBackwardLabel]="(s) => '-' + s + ' sekundi'"
  [evaSeekForwardLabel]="(s) => '+' + s + ' sekundi'"
/>

<!-- Custom icons via content projection -->
<eva-double-tap-seek [evaCustomIcon]="true">
  <img evaSeekBackward src="path-to-your-rewind-icon" />
  <img evaSeekForward src="path-to-your-fast-forward-icon" />
</eva-double-tap-seek>

<!-- Custom ripple duration (default is 600ms) -->
<eva-double-tap-seek [evaRippleDurationMs]="1000" />

<!-- Disabling the ripple flash (toggleable at runtime; the label and seek itself are unaffected) -->
<eva-double-tap-seek [evaRippleEnabled]="rippleEnabled()" />
```

### Gesture Behavior

| Interaction | Result |
|---|---|
| Single tap, no follow-up within 300ms | `EvaApi.playOrPauseVideo()` — same as tapping `<eva-overlay-play>`. |
| Two taps within 300ms, same zone | Seeks backward/forward by `evaDoubleTapSeekSeconds`, shows a ripple + label. |
| A further tap within 300ms of the last one, same zone | Seeks again and accumulates the label (`-10s` → `-20s` → `-30s`, …). |
| Tap on the opposite zone while a sequence is active | Ends the current sequence immediately; the new zone starts its own fresh single/double-tap detection. |
| No further tap within 300ms of the last one | The accumulated sequence resets; the next tap on either zone starts fresh. |

### Sizing

Mirrors [`EvaOverlayPlay`](overlay-play.md)'s own sizing behavior — the zones cover the full player once the controls bar auto-hides, and leave room for it while the controls bar is visible, by subscribing to the same `EvaApi.componentsContainerVisibilityStateSubject`.

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-double-tap-ripple-background` | `rgba(255, 255, 255, 0.25)` | Background color of the tap ripple flash. |
| `--eva-double-tap-ripple-duration` | `0.6s` | Duration of the ripple flash animation. Overridden per-instance by `evaRippleDurationMs` — set this global default only if you want to skip passing the input everywhere. |
| `--eva-double-tap-label-background` | `rgba(0, 0, 0, 0.6)` | Background color of the seek amount label. |
| `--eva-double-tap-label-color` | `white` | Text/icon color of the seek amount label. |
| `--eva-double-tap-label-font-size` | `14px` | Font size of the seek amount label text. |
| `--eva-double-tap-label-padding` | `14px 18px` | Inner padding of the seek amount label. |
| `--eva-double-tap-label-icon-size` | `28px` | Width/height of the icon inside the seek amount label. |

Respects `prefers-reduced-motion: reduce` — the ripple flash and label entrance animations are disabled entirely.
