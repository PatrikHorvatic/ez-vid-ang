## EvaTrackSelector

A subtitle/text track selector component that renders a dropdown listing all available subtitle tracks plus an "Off" option. The track list merges two sources:

- `EvaApi.videoTracksSubject`, filtered to `kind === "subtitles"` — tracks declared via `evaVideoTracks` and rendered as native `<track>` elements.
- `EvaApi.streamSubtitleTracksSubject` — manifest-native tracks discovered by `EvaHlsDirective`/`EvaDashDirective` from an HLS/DASH stream, if active (see [HLS Integration](#hls-integration) / [DASH Integration](#dash-integration) below).

Selecting a declared track sets its `mode` to `"showing"` on the native `HTMLVideoElement` and hides all others. Selecting a manifest-native track instead routes through `EvaApi.setStreamSubtitleTrack()`. The two sources are mutually exclusive — selecting one always turns the other off — and share a single "Off" option. Manifest-native tracks are never auto-selected, even if the stream marks one `DEFAULT=YES`; a track only becomes active once explicitly picked.

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

<!-- With subtitle tracks defined on the player -->
<eva-player
  id="my-player"
  [evaVideoSources]="sources"
  [evaVideoTracks]="[
    { kind: 'subtitles', srclang: 'en', label: 'English', src: 'en.vtt' },
    { kind: 'subtitles', srclang: 'es', label: 'Spanish', src: 'es.vtt', default: true },
    { kind: 'subtitles', srclang: 'fr', label: 'French', src: 'fr.vtt' }
  ]"
>
  <eva-subtitle-display />
  <eva-controls-container>
    <eva-play-pause />
    <eva-controls-divider />
    <eva-track-selector evaTrackSelectorText="Subtitles" evaTrackOffText="None" />
  </eva-controls-container>
</eva-player>
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

### HLS Integration

The `EvaHlsDirective` listens to `SUBTITLE_TRACKS_UPDATED` and registers tracks automatically. Each hls.js subtitle track object (`{ id, name, lang }`) maps to an `EvaStreamSubtitleTrack`:

| hls.js field | `EvaStreamSubtitleTrack` field |
|---|---|
| `id` | `id` |
| `name` (fallback: `lang`, then `"Track {id}"`) | `label` |
| `lang` (omitted when empty) | `language` |

Selecting a stream track from `eva-track-selector` sets `hls.subtitleTrack` to its `id` and `hls.subtitleDisplay` to `true`; selecting "Off" (or a declared track) sets `hls.subtitleTrack = -1` and `hls.subtitleDisplay = false`. See [HLS streaming directive docs](../streaming/hls.md) for the `subtitleDisplay` default.

---

### DASH Integration

The `EvaDashDirective` reads `getTracksFor('text')` after `STREAM_INITIALIZED`. Unlike audio tracks, text tracks are registered even when only one (or zero) is available — "Off" is still a meaningful second option for subtitles. Each DASH `MediaInfo` object maps to an `EvaStreamSubtitleTrack`:

| DASH field | `EvaStreamSubtitleTrack` field |
|---|---|
| Array index | `id` |
| `labels[0].text` (fallback: `lang`, then `"Track {n}"`) | `label` |
| `lang` (omitted when empty) | `language` |

Selecting a stream track from `eva-track-selector` calls `dash.setTextTrack()` with its index and `dash.enableText(true)`; selecting "Off" (or a declared track) calls `dash.enableText(false)`. See [DASH streaming directive docs](../streaming/dash.md) for the `streaming.text.defaultEnabled` default.

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

### `EvaStreamSubtitleTrack`

The type representing a single manifest-native HLS/DASH subtitle track. Consumed by `EvaTrackSelector`; also accessible via the `EvaApi.streamSubtitleTracksSubject` observable for custom UI.

| Property | Type | Description |
|---|---|---|
| `id` | `number` | Opaque identifier used internally to switch the track. |
| `label` | `string` | Human-readable label (e.g. `"English"`, `"Français"`). |
| `language` | `string` (optional) | BCP 47 language tag (e.g. `"en"`, `"fr"`, `"hr"`). |

---

### Settings Panel Integration

You can add subtitle/caption track selection to the `EvaSettingsPanel`. Subscribe to `EvaApi.videoTracksSubject` to dynamically populate the sub-menu:

```typescript
private tracksSub: Subscription | null = null;

public ngOnInit(): void {
  this.tracksSub = this.api.videoTracksSubject.subscribe(tracks => {
    if (!tracks?.length) { return; }

    const subtitleTracks = tracks.filter(
      t => t.kind === 'subtitles' || t.kind === 'captions',
    );
    if (!subtitleTracks.length) { return; }

    const trackItem: EvaSettingsMenuItem = {
      id: 'subtitles',
      label: 'Subtitles',
      currentValue: 'Off',
      options: [
        { id: 'off', label: 'Off', selected: true },
        ...subtitleTracks.map(t => ({
          id: t.label ?? t.srclang ?? 'unknown',
          label: t.label ?? t.srclang ?? 'Unknown',
        })),
      ],
    };

    this.settingsItems.update(items => {
      const idx = items.findIndex(i => i.id === 'subtitles');
      if (idx !== -1) {
        const copy = [...items];
        copy[idx] = trackItem;
        return copy;
      }
      return [...items, trackItem];
    });
  });
}

public ngOnDestroy(): void {
  this.tracksSub?.unsubscribe();
}

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'subtitles') {
    this.api.subtitlesChanged(
      event.optionId === 'off'
        ? null
        : { id: event.optionId, label: event.label, selected: true },
    );
    this.settingsItems.update(items =>
      items.map(item =>
        item.id === 'subtitles'
          ? {
              ...item,
              currentValue: event.label,
              options: item.options?.map(opt => ({
                ...opt,
                selected: opt.id === event.optionId,
              })),
            }
          : item,
      ),
    );
  }
}
```