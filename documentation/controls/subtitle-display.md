## EvaSubtitleDisplay

Renders the currently active subtitle cue over the video. Reads `EvaApi.currentSubtitleCue` directly — no additional subscription to the track is needed for the cue text itself. Automatically hides during Picture-in-Picture and adjusts its bottom position when the controls bar is visible.

### Selector

```html
<eva-subtitle-display />
```


### Usage

```html
<eva-player>
	<!-- The component must not be a part of the controls container! -->
	<eva-subtitle-display />
	<eva-controls-container>

	</eva-controls-container>
</eva-player>
```

### Host Behaviour


| Condition | Effect |
|---|---|
| `currentSubtitleCue !== null` AND not in PiP | Adds `eva-subtitle-display--visible` — makes the host visible. |
| PiP active (`pipWindowActive === true`) | `eva-subtitle-display--visible` is suppressed. The browser renders subtitles natively inside the PiP window via the active `TextTrack` (switched to `mode="showing"` by `EvaApi.setupPipListeners()`). |
| Controls container visible | `padding-bottom: calc(--eva-control-element-height + --eva-scrub-bar-heights + 12px)` — shifts subtitles above the controls bar. |
| Controls container hidden | `padding-bottom: 8px` — minimal offset from the bottom edge. |


### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-subtitle-font-family` | `inherit` | Font family for subtitle cue text. |
| `--eva-subtitle-font-size` | `1.3rem` | Font size of the cue text. |
| `--eva-subtitle-background` | `rgba(0, 0, 0, 0.72)` | Background color behind the cue text. |
| `--eva-subtitle-padding` | `0.15em 0.5em` | Padding around the cue text. |
| `--eva-subtitle-color` | `white` | Text color of the cue. |
| `--eva-subtitle-offset` | `calc(--eva-control-element-height + --eva-scrub-bar-heights + 5px)` | **Do not override.** Computed offset used internally for positioning. |
| `--eva-control-element-height` | `50px` | Height of the controls bar. Used in the `padding-bottom` calculation. |
| `--eva-scrub-bar-heights` | `5px` | Height of the scrub bar. Used in the `padding-bottom` calculation. |
| `--eva-transition-duration` | `0.25s` | Duration of the `padding-bottom` transition when controls show or hide. |

### EvaApi Integration

| API member | Usage |
|---|---|
| `EvaApi.currentSubtitleCue` | Signal read directly — provides the cue text to render. Updated by `EvaCueChangeDirective`. |
| `EvaApi.componentsContainerVisibilityStateSubject` | Subscribed on init. Controls the `padding-bottom` offset. |
| `EvaApi.pictureInPictureSubject` | Subscribed on init. Suppresses the subtitle overlay when PiP is active. |