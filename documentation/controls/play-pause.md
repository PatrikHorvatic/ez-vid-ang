## EvaPlayPause

A play/pause toggle button rendered as a `role="button"` element. Tracks the current video state via `EvaApi` and updates its icon, `aria-label`, and `aria-valuetext` accordingly. Built-in icons can be replaced via content projection.

### Selector

```html
<eva-play-pause />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaPlayPauseAria` | `EvaPlayPauseAria` | No | See [`EvaPlayPauseAria`](#) | ARIA labels and value texts for each playback state. |
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead. |

### Usage

```html
<!-- Minimal usage -->
<eva-play-pause />

<!-- Custom ARIA labels -->
<eva-play-pause
  [evaPlayPauseAria]="{
    ariaLabel: { play: 'Play', pause: 'Pause' },
    ariaValueText: { playing: 'Playing', paused: 'Paused', loading: 'Loading', ended: 'Ended', errored: 'Error' }
  }"
/>

<!-- Custom icon via content projection -->
<eva-play-pause [evaCustomIcon]="true">
  <img evaPlay src="play-icon.svg" />
  <img evaPause src="pause-icon.svg" />
</eva-play-pause>
```

### Icon Registry Keys

| State | Registry key |
|---|---|
| `playing` | `pause` |
| `loading`, `paused`, `ended`, `error` | `play` |

Register icons before using the component:

```typescript
import { addEvaIcons } from 'ez-vid-ang';
import { evaPlayIcon, evaPauseIcon } from 'ez-vid-ang/icons';
addEvaIcons({ evaPlayIcon, evaPauseIcon });
```

When `evaCustomIcon` is `true`, the registry icons are suppressed and `<ng-content>` is rendered instead.

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` | Toggle play/pause |
| `Space` | Toggle play/pause |


### `EvaPlayPauseAria`

| Property | Default |
|---|---|
| `ariaLabel.play` | `"play"` |
| `ariaLabel.pause` | `"pause"` |
| `ariaValueText.playing` | `"playing"` |
| `ariaValueText.loading` | `"loading"` |
| `ariaValueText.paused` | `"paused"` |
| `ariaValueText.ended` | `"ended"` |
| `ariaValueText.errored` | `"errored"` |

### Settings Panel Integration

You can add a play/pause action to the `EvaSettingsPanel`:

```typescript
protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  { id: 'play-pause', label: 'Play / Pause' },
]);

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'play-pause') {
    this.api.playOrPauseVideo();
  }
}
```