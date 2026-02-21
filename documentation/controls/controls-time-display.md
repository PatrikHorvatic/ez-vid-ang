## EvaTimeDisplay

A time display component that renders a single time value — current, total, or remaining — formatted according to the specified format string. For live streams, the time value is replaced with a configurable live label.

### Selector

```html
<eva-time-display />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaTimeProperty` | `EvaTimeProperty` | ✅ Yes | — | Which time value to display: `"current"`, `"total"`, or `"remaining"`. Also determines which `evaAria` label is applied. |
| `evaTimeFormating` | `EvaTimeFormating` | ✅ Yes | — | Format used to render the time value. See [Types — `EvaTimeFormating`](#). |
| `evaLiveText` | `string` | No | `"LIVE"` | Text shown in place of the time value when the stream is live. |
| `evaAria` | `EvaTimeDisplayAria` | No | See [Aria Types — `EvaTimeDisplayAria`](#) | ARIA labels for the timer element, keyed by `evaTimeProperty`. |

### Usage

```html
<!-- Current time in mm:ss -->
<eva-time-display evaTimeProperty="current" evaTimeFormating="mm:ss" />

<!-- Total duration in HH:mm:ss -->
<eva-time-display evaTimeProperty="total" evaTimeFormating="HH:mm:ss" />

<!-- Remaining time with custom live label and ARIA label -->
<eva-time-display
  evaTimeProperty="remaining"
  evaTimeFormating="mm:ss"
  evaLiveText="● LIVE"
  [evaAria]="{ ariaLabelRemaining: 'Time remaining' }"
/>
```

### Accessibility

The component renders as `role="timer"` with `aria-live="off"` by default to prevent screen readers from announcing every time update. Set `aria-live` to `"polite"` if live announcements are desired. `aria-atomic="true"` ensures the full value is read as a single unit when announced.

The `aria-label` is resolved from `evaAria` based on the active `evaTimeProperty`:

| `evaTimeProperty` | `aria-label` source |
|---|---|
| `"current"` | `ariaLabelCurrent` |
| `"total"` | `ariaLabelTotal` |
| `"remaining"` | `ariaLabelRemaining` |

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-time-display-text-color` | `white` | Color of the time display text. |