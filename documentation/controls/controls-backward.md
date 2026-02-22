# EvaBackwardComponent

## Overview

`EvaBackwardComponent` is an Angular component that renders a backward seek button for the Eva video player. Clicking the button seeks the video backward by a configurable number of seconds via `EvaApi`.

**Selector:** `eva-backward`

---

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `evaAria` | `EvaBackwardAria` | See below | ARIA label for the button. |
| `evaCustomIcon` | `boolean` | `false` | When `true`, suppresses all built-in icon classes. |
| `evaForwardSeconds` | `number` | `10` | Number of seconds to seek backward. Affects which icon class is applied. Validated via `validateAndTransformEvaForwardAndBackwardSeconds`. |

### `evaAria` defaults

| Property | Default |
|---|---|
| `ariaLabel` | Provided by `transformEvaBackwardAria` |

---

## Host Bindings

| Binding | Description |
|---|---|
| `role="button"` | Identifies the element as a button for assistive technologies. |
| `tabindex="0"` | Makes the element focusable via keyboard. |
| `aria-label` | Bound to `evaAria().ariaLabel`. |
| `eva-icon` | Applied when `evaCustomIcon` is `false`. Base icon class. |
| `eva-icon-replay_10` | Applied when `evaCustomIcon` is `false` and `evaForwardSeconds` is `10`. |
| `eva-icon-replay_30` | Applied when `evaCustomIcon` is `false` and `evaForwardSeconds` is `30`. |

---

## Icon Classes

The built-in icon is determined by the value of `evaForwardSeconds`:

| `evaForwardSeconds` | Applied class |
|---|---|
| `10` | `eva-icon-replay_10` |
| `30` | `eva-icon-replay_30` |

For any other value, no built-in icon class is applied — use `evaCustomIcon` and provide your own.

---

## Keyboard Support

| Key | Action |
|---|---|
| `Enter` | Seek backward by `evaForwardSeconds` |
| `Space` | Seek backward by `evaForwardSeconds` |

---

## Behaviour

On click or keyboard activation, the component calls `EvaApi.seekBack(evaForwardSeconds())`, delegating the seek logic entirely to the API layer.

---

## Usage Examples

Default — seek backward 10 seconds:
```html
<eva-backward />
```

Seek backward 30 seconds:
```html
<eva-backward [evaForwardSeconds]="30" />
```

Custom icon and ARIA label:
```html
<eva-backward
  [evaCustomIcon]="true"
  [evaAria]="{ ariaLabel: 'Rewind 10 seconds' }"
>
	<!-- your custom icon/content -->
</eva-backward>
```