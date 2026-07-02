# EvaForward

## Overview

`EvaForward` is a component that renders a forward seek button for the Eva video player. Clicking the button seeks the video forward by a configurable number of seconds via `EvaApi`.

**Selector:** `eva-forward`

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `evaAria` | `EvaForwardAria` | See below | ARIA label for the button. |
| `evaCustomIcon` | `boolean` | `false` | When `true`, suppresses the registry-sourced icon and renders `<ng-content>` instead. |
| `evaForwardSeconds` | `number` | `10` | Number of seconds to seek forward. Affects which registry icon is used. Validated via `validateAndTransformEvaForwardAndBackwardSeconds`. |

### `evaAria` defaults

| Property | Default |
|---|---|
| `ariaLabel` | Provided by `transformEvaForwardAria` |

## Host Bindings

| Binding | Description |
|---|---|
| `role="button"` | Identifies the element as a button for assistive technologies. |
| `tabindex="0"` | Makes the element focusable via keyboard. |
| `aria-label` | Bound to `evaAria().ariaLabel`. |

## Icon Registry Keys

The built-in icon is determined by the value of `evaForwardSeconds`:

| `evaForwardSeconds` | Registry key |
|---|---|
| `10` | `forward-10` |
| `30` | `forward-30` |

For any other value, no built-in icon is rendered — use `evaCustomIcon` and provide your own.

Register icons before using the component:

```typescript
import { addEvaIcons } from 'ez-vid-ang';
import { evaForward10Icon, evaForward30Icon } from 'ez-vid-ang/icons';
addEvaIcons({ evaForward10Icon, evaForward30Icon });
```

## Keyboard Support

| Key | Action |
|---|---|
| `Enter` | Seek forward by `evaForwardSeconds` |
| `Space` | Seek forward by `evaForwardSeconds` |

## Behaviour

On click or keyboard activation, the component calls `EvaApi.seekForward(evaForwardSeconds())`, delegating the seek logic entirely to the API layer.

## Usage Examples


```html
<eva-player>
  <eva-controls-container>

    <!-- Default — seek forward 10 seconds -->
    <eva-forward />

    <!-- Seek forward 30 seconds -->  
    <eva-forward [evaForwardSeconds]="30" />

    <!-- Custom icon and ARIA label -->
    <eva-forward [evaCustomIcon]="true" [evaAria]="{ ariaLabel: 'Skip forward 10 seconds' }">
    	<!-- your custom icon/content -->
    </eva-forward>

  </eva-controls-container>
</eva-player>
```

## Settings Panel Integration

You can add seek-forward actions to the `EvaSettingsPanel` — useful for "Skip intro" or "Jump ahead" features:

```typescript
protected readonly settingsItems = signal<EvaSettingsMenuItem[]>([
  { id: 'skip-intro', label: 'Skip intro' },
]);

protected onSettingChanged(event: EvaSettingsMenuEvent): void {
  if (event.itemId === 'skip-intro') {
    this.api.seekForward(30);
  }
}
```