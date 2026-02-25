## EvaControlsDivider

A visual and semantic separator for use between controls inside `eva-controls-container`. Renders as a `role="separator"` element with a horizontal orientation, providing both visual spacing and accessible structure to the controls bar.

### Selector

```html
<eva-controls-divider />
```

### Usage

```html
<eva-player>
  <eva-controls-container>
    <eva-play-pause />
    <eva-time-display evaTimeProperty="current" evaTimeFormating="mm:ss" />
  
    <eva-controls-divider />
  
    <eva-volume />
    <eva-fullscreen />
  </eva-controls-container>
</eva-player>
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaAria` | `EvaControlsDividerAria` | No | See below | ARIA label for the separator element. |

### Aria Types

**`EvaControlsDividerAria`**

| Property | Type | Default | Description |
|---|---|---|---|
| `ariaLabel` | `string` | `"Controls divider"` | Accessible label for the separator. |