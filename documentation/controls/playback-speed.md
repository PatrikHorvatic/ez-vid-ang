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
| `evaAria` | `EvaPlaybackSpeedAria` | No | See [`EvaPlaybackSpeedAria`](#) | ARIA label for the speed selector button. |

### Usage

```html
<!-- Minimal usage -->
<eva-playback-speed [evaPlaybackSpeeds]="[0.5, 1, 1.5, 2]" />

<!-- With custom ARIA label -->
<eva-playback-speed
  [evaPlaybackSpeeds]="[0.5, 1, 1.5, 2]"
  [evaAria]="{ ariaLabel: 'Video speed' }"
/>

<!-- Fine-grained speed options for educational content -->
<eva-playback-speed [evaPlaybackSpeeds]="[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]" />

<!-- Speeds for a podcast player (only faster options) -->
<eva-playback-speed [evaPlaybackSpeeds]="[1, 1.25, 1.5, 2, 3]" />

<!-- Inside a full controls bar -->
<eva-controls-container>
  <eva-play-pause />
  <eva-time-display evaTimeProperty="current" evaTimeFormating="mm:ss" />
  <eva-controls-divider />
  <eva-playback-speed [evaPlaybackSpeeds]="[0.5, 1, 1.5, 2]" />
  <eva-fullscreen />
</eva-controls-container>
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

### Settings Panel Integration

Instead of using `<eva-playback-speed>` as a standalone button, you can consolidate speed selection into the `EvaSettingsPanel`:

```typescript
protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  {
    id: 'speed',
    label: 'Playback speed',
    currentValue: 'Normal',
    options: [
      { id: '0.25', label: '0.25x' },
      { id: '0.5', label: '0.5x' },
      { id: '1', label: 'Normal', selected: true },
      { id: '1.5', label: '1.5x' },
      { id: '2', label: '2x' },
    ],
  },
]);

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'speed') {
    this.api.setPlaybackSpeed(Number(event.optionId));
    // Update sub-menu to reflect new selection
    this.settingsItems.update(items =>
      items.map(item =>
        item.id === 'speed'
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