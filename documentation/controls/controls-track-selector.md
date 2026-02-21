## EvaTrackSelector

A subtitle/text track selector component that renders a dropdown listing all available subtitle tracks plus an "Off" option. Selecting a track sets its `mode` to `"showing"` on the native `HTMLVideoElement` and hides all others. The track list is sourced from `EvaApi.videoTracksSubject`, filtered to `kind === "subtitles"`.

The dropdown closes on track selection, outside click, blur, or `Escape`.

---

### Selector

```html
<eva-track-selector />
```

---

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaTrackSelectorText` | `string` | No | `"Track selector"` | Label for the selector button. Also used as the prefix in screen reader announcements (e.g. `"Track selector: English"`). |
| `evaTrackOffText` | `string` | No | `"Off"` | Label for the option that disables all subtitle tracks. |

---

### Usage

```html
<!-- Minimal usage -->
<eva-track-selector />

<!-- Custom labels -->
<eva-track-selector
  evaTrackSelectorText="Subtitles"
  evaTrackOffText="Disabled"
/>
```

---

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` / `Space` | Open the dropdown |
| `ArrowDown` | Open dropdown, or select the next track |
| `ArrowUp` | Open dropdown, or select the previous track |
| `Home` | Select the first track (only when open) |
| `End` | Select the last track (only when open) |
| `Escape` | Close the dropdown |

---

### Accessibility

Track selection changes are announced to screen readers by temporarily injecting a `role="status"` live region into the document body. The announcement reads as `"{evaTrackSelectorText}: {trackLabel}"` and the element is removed from the DOM after 1 second.

---

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-track-selector-label-font-size` | `14px` | Font size of the selector button label. |
| `--eva-track-selector-label-color` | `rgba(255, 255, 255, 0.95)` | Color of the selector button label. |
| `--eva-track-selector-dropdown-arrow-size` | `20px` | Size of the dropdown arrow icon. |
| `--eva-track-selector-dropdown-arrow-color` | `rgba(255, 255, 255, 0.6)` | Color of the dropdown arrow icon. |
| `--eva-track-selector-hover-background` | `rgba(255, 255, 255, 0.1)` | Background of the selector button on hover. |
| `--eva-track-selector-opened-background` | `rgba(255, 255, 255, 0.15)` | Background of the selector button when the dropdown is open. |
| `--eva-track-selector-dropdown-content-background` | `rgba(28, 28, 30, 0.95)` | Background of the dropdown panel. |
| `--eva-track-selector-dropdown-content-box-shadow` | `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)` | Box shadow of the dropdown panel. |
| `--eva-track-selector-dropdown-content-header-font-size` | `14px` | Font size of the dropdown header. |
| `--eva-track-selector-dropdown-content-header-font-color` | `rgba(255, 255, 255, 0.5)` | Color of the dropdown header text. |
| `--eva-track-selector-dropdown-content-header-bottom-border` | `1px solid rgba(255, 255, 255, 0.1)` | Bottom border of the dropdown header. |
| `--eva-track-selector-dropdown-content-speed-option-bacground-hover` | `rgba(255, 255, 255, 0.1)` | Background of a track option on hover. |
| `--eva-track-selector-dropdown-content-speed-option-icon-active` | `rgba(59, 130, 246, 0.3)` | Background of the active track option icon. |
| `--eva-track-selector-dropdown-content-speed-option-font-size` | `14px` | Font size of track option labels. |
| `--eva-track-selector-dropdown-content-speed-option-font-color` | `rgba(255, 255, 255, 0.95)` | Color of track option labels. |
| `--eva-track-selector-dropdown-content-speed-option-checkmark-size` | `16px` | Size of the checkmark icon on the active track. |
| `--eva-track-selector-dropdown-content-speed-option-checkmark-color` | `rgb(59, 130, 246)` | Color of the checkmark icon on the active track. |