# EvaForward

## Overview

`EvaForward` is a component that renders a forward seek button for the Eva video player. Clicking the button seeks the video forward by a configurable number of seconds via `EvaApi`.

**Selector:** `eva-forward`

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `evaAria` | `EvaForwardAria` | See below | ARIA label for the button. |
| `evaCustomIcon` | `boolean` | `false` | When `true`, suppresses all built-in icon classes. |
| `evaForwardSeconds` | `number` | `10` | Number of seconds to seek forward. Affects which icon class is applied. Validated via `validateAndTransformEvaForwardAndBackwardSeconds`. |

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
| `eva-icon` | Applied when `evaCustomIcon` is `false`. Base icon class. |
| `eva-icon-forward_10` | Applied when `evaCustomIcon` is `false` and `evaForwardSeconds` is `10`. |
| `eva-icon-forward_30` | Applied when `evaCustomIcon` is `false` and `evaForwardSeconds` is `30`. |

## Icon Classes

The built-in icon is determined by the value of `evaForwardSeconds`:

| `evaForwardSeconds` | Applied class |
|---|---|
| `10` | `eva-icon-forward_10` |
| `30` | `eva-icon-forward_30` |

For any other value, no built-in icon class is applied — use `evaCustomIcon` and provide your own.

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