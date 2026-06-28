## EvaQualitySelector

A quality/bitrate selector component that renders a dropdown listing all available quality levels. Quality levels are populated automatically from the streaming library (HLS or DASH) via `EvaApi.qualityLevelsSubject` — no manual wiring is needed. The dropdown includes an "Auto" option that restores ABR (adaptive bitrate) mode.

The dropdown closes on quality selection, outside click, blur, or `Escape`.

---

### Selector

```html
<eva-quality-selector />
```

---

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaQualitySelectorText` | `string` | No | `"Quality selector"` | Label for the selector button. Also used as the prefix in screen reader announcements. |
| `evaQualityAutoText` | `string` | No | `"Auto"` | Label for the Auto (ABR) option in the dropdown. |
| `evaAria` | `EvaQualityAria` | No | See below | ARIA label for the quality selector button. |

---

### Usage

```html
<!-- Minimal usage — quality levels are populated automatically from HLS/DASH -->
<eva-quality-selector />

<!-- Custom labels -->
<eva-quality-selector
  evaQualitySelectorText="Resolution"
  evaQualityAutoText="Automatic"
/>

<!-- Custom ARIA label -->
<eva-quality-selector
  [evaAria]="{ ariaLabel: 'Video quality' }"
/>

<!-- Combined with HLS streaming — quality levels appear after manifest is parsed -->
<eva-player
  evaHls
  id="my-player"
  [evaVideoSources]="[]"
  evaHlsSrc="https://example.com/stream.m3u8"
>
  <eva-controls-container>
    <eva-play-pause />
    <eva-quality-selector evaQualitySelectorText="Quality" evaQualityAutoText="Auto" />
  </eva-controls-container>
</eva-player>

<!-- Combined with DASH streaming -->
<eva-player
  evaDash
  id="my-player"
  [evaVideoSources]="[]"
  evaDashSrc="https://example.com/stream.mpd"
>
  <eva-controls-container>
    <eva-quality-selector />
  </eva-controls-container>
</eva-player>
```

---

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` / `Space` | Open or close the dropdown |
| `ArrowDown` | Open dropdown, or select the next quality level |
| `ArrowUp` | Open dropdown, or select the previous quality level |
| `Home` | Select the first quality level (only when open) |
| `End` | Select the last quality level (only when open) |
| `Escape` | Close the dropdown |

---

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-quality-selector-label-font-size` | `14px` | Font size of the selector button label. |
| `--eva-quality-selector-label-color` | `rgba(255, 255, 255, 0.95)` | Color of the selector button label. |
| `--eva-quality-selector-dropdown-arrow-size` | `20px` | Size of the dropdown arrow icon. |
| `--eva-quality-selector-dropdown-arrow-color` | `rgba(255, 255, 255, 0.6)` | Color of the dropdown arrow icon. |
| `--eva-quality-selector-hover-background` | `rgba(255, 255, 255, 0.1)` | Background of the selector button on hover. |
| `--eva-quality-selector-opened-background` | `rgba(255, 255, 255, 0.15)` | Background of the selector button when the dropdown is open. |
| `--eva-quality-selector-dropdown-content-background` | `rgba(28, 28, 30, 0.95)` | Background of the dropdown panel. |
| `--eva-quality-selector-dropdown-content-box-shadow` | `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)` | Box shadow of the dropdown panel. |
| `--eva-quality-selector-dropdown-content-header-font-size` | `14px` | Font size of the dropdown header. |
| `--eva-quality-selector-dropdown-content-header-font-color` | `rgba(255, 255, 255, 0.5)` | Color of the dropdown header text. |

---

### `EvaQualityAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Quality selector"` |

### Settings Panel Integration

Instead of using `<eva-quality-selector>` as a standalone button, you can consolidate quality selection into the `EvaSettingsPanel`. Subscribe to `EvaApi.qualityLevelsSubject` to dynamically populate the sub-menu when streaming levels become available:

```typescript
private qualitySub: Subscription | null = null;

public ngOnInit(): void {
  this.qualitySub = this.api.qualityLevelsSubject.subscribe(levels => {
    if (!levels.length) { return; }

    const qualityItem: EvaSettingsMenuItem = {
      id: 'quality',
      label: 'Quality',
      currentValue: 'Auto',
      options: levels.map(level => ({
        id: String(level.qualityIndex),
        label: level.isAuto ? 'Auto' : level.label,
        selected: level.selected,
      })),
    };

    this.settingsItems.update(items => {
      const idx = items.findIndex(i => i.id === 'quality');
      if (idx !== -1) {
        const copy = [...items];
        copy[idx] = qualityItem;
        return copy;
      }
      return [...items, qualityItem];
    });
  });
}

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'quality') {
    this.api.setQuality(Number(event.optionId));
    this.settingsItems.update(items =>
      items.map(item =>
        item.id === 'quality'
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
