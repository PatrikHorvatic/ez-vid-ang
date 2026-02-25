## EvaPlaybackSpeed

A playback speed selector component that renders a dropdown of available speeds. The dropdown closes on speed selection, outside click, blur, or `Escape`.

### Selector

```html
<eva-playback-speed />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaPlaybackSpeeds` | `number[]` | ✅ Yes | — | Available playback speeds. Values outside `0.25`–`4` are removed, duplicates are stripped. Falls back to `[1]` if the result is empty. Display order follows the array order — sorting is the consumer's responsibility. |
| `evaDefaultPlaybackSpeed` | `number` | No | `1` | Speed pre-selected on init. Must exist in `evaPlaybackSpeeds` — falls back to the first speed if not found. |
| `evaAria` | `EvaPlaybackSpeedAria` | No | See [`EvaPlaybackSpeedAria`](#) | ARIA label for the speed selector button. |

### Usage

```html
<!-- Minimal usage -->
<eva-playback-speed [evaPlaybackSpeeds]="[0.5, 1, 1.5, 2]" />

<!-- With a default speed and custom ARIA label -->
<eva-playback-speed
  [evaPlaybackSpeeds]="[0.5, 1, 1.5, 2]"
  [evaDefaultPlaybackSpeed]="1.5"
  [evaAria]="{ ariaLabel: 'Video speed' }"
/>
```

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` / `Space` | Open or close the dropdown |
| `ArrowDown` | Open dropdown, or select the next speed |
| `ArrowUp` | Open dropdown, or select the previous speed |
| `Home` | Select the first speed (only when open) |
| `End` | Select the last speed (only when open) |
| `Escape` | Close the dropdown |

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-playback-speed-label-font-size` | `14px` | Font size of the speed button label. |
| `--eva-playback-speed-label-color` | `rgba(255, 255, 255, 0.95)` | Color of the speed button label. |
| `--eva-playback-speed-dropdown-arrow-size` | `20px` | Size of the dropdown arrow icon. |
| `--eva-playback-speed-dropdown-arrow-color` | `rgba(255, 255, 255, 0.6)` | Color of the dropdown arrow icon. |
| `--eva-playback-speed-hover-background` | `rgba(255, 255, 255, 0.1)` | Background of the speed button on hover. |
| `--eva-playback-speed-opened-background` | `rgba(255, 255, 255, 0.15)` | Background of the speed button when the dropdown is open. |
| `--eva-playback-speed-dropdown-content-background` | `rgba(28, 28, 30, 0.95)` | Background of the dropdown panel. |
| `--eva-playback-speed-dropdown-content-box-shadow` | `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)` | Box shadow of the dropdown panel. |
| `--eva-playback-speed-dropdown-content-header-font-size` | `14px` | Font size of the dropdown header. |
| `--eva-playback-speed-dropdown-content-header-font-color` | `rgba(255, 255, 255, 0.5)` | Color of the dropdown header text. |
| `--eva-playback-speed-dropdown-content-header-bottom-border` | `1px solid rgba(255, 255, 255, 0.1)` | Bottom border of the dropdown header. |
| `--eva-playback-speed-dropdown-content-speed-option-bacground-hover` | `rgba(255, 255, 255, 0.1)` | Background of a speed option on hover. |
| `--eva-playback-speed-dropdown-content-speed-option-icon-active` | `rgba(59, 130, 246, 0.3)` | Background of the active speed option icon. |
| `--eva-playback-speed-dropdown-content-speed-option-font-size` | `14px` | Font size of speed option labels. |
| `--eva-playback-speed-dropdown-content-speed-option-font-color` | `rgba(255, 255, 255, 0.95)` | Color of speed option labels. |
| `--eva-playback-speed-dropdown-content-speed-option-checkmark-size` | `16px` | Size of the checkmark icon on the active speed. |
| `--eva-playback-speed-dropdown-content-speed-option-checkmark-color` | `rgb(59, 130, 246)` | Color of the checkmark icon on the active speed. |

### `EvaPlaybackSpeedAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Playback speed"` |