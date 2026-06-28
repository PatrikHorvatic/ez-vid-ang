## EvaVolume

A volume slider component for the Eva video player. Rendered as a `role="slider"` element supporting click, drag, touch, and keyboard interaction. Volume changes are kept in sync with `EvaApi` and announced to screen readers via a debounced live region.

### Selector

```html
<eva-volume />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaAria` | `EvaVolumeAria` | No | See [`EvaVolumeAria`](#) | ARIA label for the volume slider. |

### Usage

```html
<!-- Minimal usage -->
<eva-volume />

<!-- Custom ARIA label -->
<eva-volume [evaAria]="{ ariaLabel: 'Video volume' }" />

<!-- Paired with mute button (common pattern) -->
<eva-controls-container>
  <eva-mute />
  <eva-volume />
</eva-controls-container>

<!-- Paired with mute button that has custom thresholds matching volume expectations -->
<eva-controls-container>
  <eva-mute [evaLowVolume]="0.2" [evaMiddleVolume]="0.6" />
  <eva-volume [evaAria]="{ ariaLabel: 'Adjust volume' }" />
</eva-controls-container>
```

### Interaction

**Click** — sets volume to the clicked position on the bar.

**Drag (mouse)** — attaches document-level `mousemove` / `mouseup` listeners for smooth dragging. Listeners are removed on `mouseup` or when the component is destroyed.

**Drag (touch)** — equivalent behaviour using `touchmove` / `touchend`.

**Keyboard** — when the slider has focus:

| Key | Action |
|---|---|
| `ArrowUp` / `ArrowRight` | Increase volume by 5% |
| `ArrowDown` / `ArrowLeft` | Decrease volume by 5% |
| `PageUp` | Increase volume by 10% |
| `PageDown` | Decrease volume by 10% |
| `Home` | Set volume to 100% |
| `End` | Mute (set volume to 0%) |

### Accessibility

Volume changes are announced to screen readers via a live region controlled by `shouldAnnounceVolume`. Announcements are debounced at 300ms to avoid excessive reads during rapid input, and the live region is cleared after 100ms.

### `EvaVolumeAria`

| Property | Default |
|---|---|
| `ariaLabel` | `"Volume control"` |

### Settings Panel Integration

You can add volume presets to the `EvaSettingsPanel` as a sub-menu:

```typescript
protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  {
    id: 'volume',
    label: 'Volume',
    currentValue: '100%',
    options: [
      { id: '1', label: '100%', selected: true },
      { id: '0.75', label: '75%' },
      { id: '0.5', label: '50%' },
      { id: '0.25', label: '25%' },
    ],
  },
]);

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'volume') {
    this.api.setVideoVolume(Number(event.optionId));
    this.settingsItems.update(items =>
      items.map(item =>
        item.id === 'volume'
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