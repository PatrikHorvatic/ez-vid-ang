# EvaBackward

## Overview

`EvaBackward` is a component that renders a backward seek button for the Eva video player. Clicking the button seeks the video backward by a configurable number of seconds via `EvaApi`.

**Selector:** `eva-backward`

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `evaAria` | `EvaBackwardAria` | See below | ARIA label for the button. |
| `evaCustomIcon` | `boolean` | `false` | When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead. |
| `evaBackwardSeconds` | `number` | `10` | Number of seconds to seek backward. Affects which registry icon is used. Validated via `validateAndTransformEvaForwardAndBackwardSeconds`. |

### `evaAria` defaults

| Property | Default |
|---|---|
| `ariaLabel` | Provided by `transformEvaBackwardAria` |

## Host Bindings

| Binding | Description |
|---|---|
| `role="button"` | Identifies the element as a button for assistive technologies. |
| `tabindex="0"` | Makes the element focusable via keyboard. |
| `aria-label` | Bound to `evaAria().ariaLabel`. |

## Icon Registry Keys

The built-in icon is determined by the value of `evaBackwardSeconds`:

| `evaBackwardSeconds` | Registry key |
|---|---|
| `10` | `backward-10` |
| `30` | `backward-30` |

For any other value, no built-in icon is rendered — use `evaCustomIcon` and provide your own.

Register icons before using the component:

```typescript
import { addEvaIcons } from 'ez-vid-ang';
import { evaBackward10Icon, evaBackward30Icon } from 'ez-vid-ang/icons';
addEvaIcons({ evaBackward10Icon, evaBackward30Icon });
```

## Keyboard Support

| Key | Action |
|---|---|
| `Enter` | Seek backward by `evaBackwardSeconds` |
| `Space` | Seek backward by `evaBackwardSeconds` |

## Behaviour

On click or keyboard activation, the component calls `EvaApi.seekBack(evaBackwardSeconds())`, delegating the seek logic entirely to the API layer.

## Usage Examples

```html
<eva-player>
  
  <eva-controls-container>
    <!-- Default — seek backward 10 seconds: -->
    <eva-backward />

    <!-- Seek backward 30 seconds: -->
    <eva-backward [evaBackwardSeconds]="30" />

    <!-- Custom icon and ARIA label: -->
    <eva-backward  [evaCustomIcon]="true" [evaAria]="{ ariaLabel: 'Rewind 10 seconds' }">
	    <!-- your custom icon/content -->
    </eva-backward>

  </eva-controls-container>
</eva-player>

```

## Settings Panel Integration

You can add a seek-backward action to the `EvaSettingsPanel`:

```typescript
protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  { id: 'replay', label: 'Replay last 10s' },
]);

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'replay') {
    this.api.seekBack(10);
  }
}
```