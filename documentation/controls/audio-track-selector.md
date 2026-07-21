## EvaAudioTrackSelector

An audio track selector component that renders a dropdown listing all available audio tracks. Tracks are populated automatically from the streaming library (HLS or DASH) via `EvaApi.audioTracksSubject` — no manual wiring is needed.

**Auto-hide:** when the stream has zero or one audio track the component hides itself with `display: none`. It is safe to include it in every player template without a conditional wrapper.

The dropdown closes on track selection, outside click, blur, or `Escape`.

---

### Selector

```html
<eva-audio-track-selector />
```

---

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaAudioTrackSelectorText` | `string` | No | `"Audio track"` | Label shown in the dropdown header. |
| `evaAria` | `EvaAudioTrackSelectorAria` | No | See below | ARIA label for the audio track selector button. |

---

### Usage

```html
<!-- Minimal usage — audio tracks are populated automatically from HLS/DASH -->
<eva-audio-track-selector />

<!-- With custom header text -->
<eva-audio-track-selector evaAudioTrackSelectorText="Language" />

<!-- Inside a full controls bar -->
<eva-controls-container>
  <eva-play-pause />
  <eva-mute />
  <eva-audio-track-selector />
  <eva-fullscreen />
</eva-controls-container>
```

---

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` / `Space` | Open or close the dropdown |
| `ArrowDown` | Open dropdown, or select the next track |
| `ArrowUp` | Open dropdown, or select the previous track |
| `Home` | Select the first track (only when open) |
| `End` | Select the last track (only when open) |
| `Escape` | Close the dropdown |

---

### Button Label

The button shows a compact representation of the currently selected track:

- **Language code available** — first two characters of the BCP 47 language tag, uppercased (e.g. `"EN"`, `"FR"`, `"HR"`).
- **No language code** — first four characters of the track label.

The full label is always shown inside the open dropdown.

---

### Dropdown Items

Each row shows the track `label` and, when present, the language tag uppercased in a muted badge on the right. The currently selected track gets a blue checkmark.

---

### HLS Integration

The `EvaHlsDirective` listens to `AUDIO_TRACKS_UPDATED` and registers tracks automatically. Each hls.js audio track object (`{ id, name, lang }`) maps to an `EvaAudioTrack`:

| hls.js field | `EvaAudioTrack` field |
|---|---|
| `id` | `id` |
| `name` (fallback: `lang`, then `"Track {id}"`) | `label` |
| `lang` (omitted when empty) | `language` |

The `AUDIO_TRACK_SWITCHED` event keeps `EvaApi.currentAudioTrackId` in sync when the streaming library switches tracks automatically.

---

### DASH Integration

The `EvaDashDirective` reads `getTracksFor('audio')` after `STREAM_INITIALIZED`. Audio tracks are registered only when two or more are available. Each DASH `MediaInfo` object maps to an `EvaAudioTrack`:

| DASH field | `EvaAudioTrack` field |
|---|---|
| Array index | `id` |
| `labels[0].text` (fallback: `lang`, then `"Audio {n}"`) | `label` |
| `lang` (omitted when empty) | `language` |

---

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-audio-track-selector-label-font-size` | `14px` | Font size of the button label. |
| `--eva-audio-track-selector-label-color` | `rgba(255, 255, 255, 0.95)` | Color of the button label. |
| `--eva-audio-track-selector-dropdown-arrow-size` | `20px` | Size of the dropdown arrow icon. |
| `--eva-audio-track-selector-dropdown-arrow-color` | `rgba(255, 255, 255, 0.6)` | Color of the dropdown arrow icon. |
| `--eva-audio-track-selector-hover-background` | `rgba(255, 255, 255, 0.1)` | Background of the button on hover. |
| `--eva-audio-track-selector-opened-background` | `rgba(255, 255, 255, 0.15)` | Background of the button when the dropdown is open. |
| `--eva-audio-track-selector-dropdown-content-background` | `rgba(28, 28, 30, 0.95)` | Background of the dropdown panel. |
| `--eva-audio-track-selector-dropdown-content-box-shadow` | `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)` | Box shadow of the dropdown panel. |
| `--eva-audio-track-selector-dropdown-content-header-font-size` | `14px` | Font size of the dropdown header. |
| `--eva-audio-track-selector-dropdown-content-header-font-color` | `rgba(255, 255, 255, 0.5)` | Color of the dropdown header. |
| `--eva-audio-track-selector-dropdown-content-header-bottom-border` | `1px solid rgba(255, 255, 255, 0.1)` | Bottom border of the dropdown header. |
| `--eva-audio-track-selector-dropdown-content-option-background-hover` | `rgba(255, 255, 255, 0.1)` | Background of an option row on hover. |
| `--eva-audio-track-selector-dropdown-content-option-icon-active` | `rgba(59, 130, 246, 0.3)` | Background of the active option row. |
| `--eva-audio-track-selector-dropdown-content-option-font-size` | `14px` | Font size of option labels. |
| `--eva-audio-track-selector-dropdown-content-option-font-color` | `rgba(255, 255, 255, 0.95)` | Color of option labels. |
| `--eva-audio-track-selector-dropdown-content-option-checkmark-size` | `16px` | Size of the active-option checkmark icon. |
| `--eva-audio-track-selector-dropdown-content-option-checkmark-color` | `rgb(59, 130, 246)` | Color of the active-option checkmark icon. |

---

### `EvaAudioTrackSelectorAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Audio track selector"` |

---

### `EvaAudioTrack`

The type representing a single audio track. Consumed by `EvaAudioTrackSelector`; also accessible via the `EvaApi.audioTracksSubject` observable for custom UI.

| Property | Type | Description |
|---|---|---|
| `id` | `number` | Opaque identifier used internally to switch the track. |
| `label` | `string` | Human-readable label (e.g. `"English"`, `"Français"`). |
| `language` | `string` (optional) | BCP 47 language tag (e.g. `"en"`, `"fr"`, `"hr"`). |
