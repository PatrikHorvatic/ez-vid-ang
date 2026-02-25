## EvaSubtitleDisplay

Renders the currently active subtitle cue. Reads `EvaApi.currentSubtitleCue` directly — no additional subscription to the track is needed. The component is invisible when `currentSubtitleCue` is `null` and adjusts its bottom offset based on whether the controls bar is visible, so subtitles never overlap the controls.

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
| `currentSubtitleCue !== null` | Adds `eva-subtitle-display--visible` class. |
| Controls container visible | `padding-bottom: calc(--eva-control-element-height + --eva-scrub-bar-heights + 12px)` |
| Controls container hidden | `padding-bottom: 8px` |

---

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-subtitle-font-family` | `inherit` | Font family for subtitle text. |
| `--eva-subtitle-font-size` | `1.3rem` | Font size of the subtitle cue text. |
| `--eva-subtitle-background` | `rgba(0, 0, 0, 0.72)` | Background color behind the cue text. |
| `--eva-subtitle-padding` | `0.15em 0.5em` | Padding around the cue text. |
| `--eva-subtitle-color` | `white` | Text color of the subtitle cue. |
| `--eva-subtitle-offset` | `calc(--eva-control-element-height + --eva-scrub-bar-heights + 5px)` | **Do not override.** Computed offset used internally to position the subtitle above the controls bar. |
| `--eva-control-element-height` | `50px` | Height of the controls bar. Used in the `padding-bottom` positioning calculation. |
| `--eva-scrub-bar-heights` | `5px` | Height of the scrub bar. Used in the `padding-bottom` positioning calculation. |