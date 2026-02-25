
## EvaPictureInPicture

Picture-in-Picture toggle button. Delegates all PiP logic to `EvaApi.changePictureInPictureStatus()` and stays in sync with the native PiP state via `EvaApi.pictureInPictureSubject` — correctly reflecting changes triggered externally by the browser (e.g. the user closing the native PiP window).

Two ARIA attributes are managed independently:
- `aria-label` — static button label, does not change with state.
- `aria-valuetext` — dynamic description that reflects the current action (`"Enter picture-in-picture"` / `"Exit picture-in-picture"`).

### Selector

```html
<eva-picture-in-picture />
```

### Usage

```html

<eva-player>
    <eva-controls-container>
        <!-- Default -->
        <eva-picture-in-picture />

        <!-- With your custom icon: -->
        <eva-picture-in-picture [evaCustomIcon]="true">
            <img src="your-pip-icon" />
        </eva-picture-in-pictrue>
    </eva-controls-container>
</eva-player> 

```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaAria` | `EvaPictureInPictureAria` | No | See below | ARIA configuration for the button. |
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses the built-in icon. Project a custom icon via content projection. |

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` | Toggles PiP |
| `Space` | Toggles PiP |

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-control-element-height` | `50px` | Sets the host element height. |
| `--eva-icon-color` | `white` | Icon color via CSS `color` / `currentColor`. |

### Aria Types

**`EvaPictureInPictureAria`**

| Property | Type | Default | Description |
|---|---|---|---|
| `ariaLabel` | `string` | `"Picture in picture"` | Static `aria-label` for the button element. |
| `ariaValueText.ariaLabelActivated` | `string` | `"Exit picture-in-picture"` | `aria-valuetext` when PiP is currently active. |
| `ariaValueText.ariaLabelDeactivated` | `string` | `"Enter picture-in-picture"` | `aria-valuetext` when PiP is currently inactive. |

### EvaApi Integration

| API member | Usage |
|---|---|
| `EvaApi.pictureInPictureSubject` | Subscribed on init. Updates `isPictureInPictureActive` to keep icon and `aria-valuetext` in sync. |
| `EvaApi.changePictureInPictureStatus()` | Called on click and keyboard activation. Handles all browser guards, support checks, and multi-player coordination. |