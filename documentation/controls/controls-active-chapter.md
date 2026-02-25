
## EvaActiveChapter

Displays the currently active chapter at the playback position and emits it when the user clicks or activates it via keyboard. Subscribes to `EvaApi.activeChapterSubject`, which is updated automatically on every `timeupdate` event — no scrubbing or user interaction is required to keep the display in sync.

Setting `EvaApi.isActiveChapterPresent = true` in `ngOnInit` enables the per-frame chapter lookup inside `EvaApi.updateVideoTime()`. Setting it back to `false` in `ngOnDestroy` disables it to avoid unnecessary work.

---

### Selector

```html
<eva-active-chapter />
```

---

### Usage

```html
<eva-player>
    <eva-controls-container>
        <!-- Default -->
        <eva-active-chapter />

        <!-- With custom icon -->
        <eva-active-chapter>
          <img src="your_image_source.png" />
        </eva-active-chapter>
    </eva-controls-container>
</eva-player>
 

```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaAria` | `EvaActiveChaptedAria` | No | See below | ARIA label for the button. |
| `evaCustomIcon` | `boolean` | No | `false` | When `true`, suppresses the default icon. Project a custom icon via content projection. |

### Outputs

| Output | Type | Description |
|---|---|---|
| `evaChapterClicked` | `EvaChapterMarker \| null` | Emitted on click or `Enter`/`Space` keypress. Emits the active chapter or `null` if none is active. |

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` | Emits `evaChapterClicked` |
| `Space` | Emits `evaChapterClicked` |

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-active-chapter-min-width` | `30px` | Minimum width of the active chapter element. |
| `--eva-active-chapter-width` | `auto` | Width of the active chapter element. |
| `--eva-active-chapter-max-width` | `200px` | Maximum width before the chapter title is truncated. |
| `--eva-active-chapter-padding` | `0px 4px` | Padding inside the active chapter element. |
| `--eva-active-chapter-hover-background` | `rgba(255, 255, 255, 0.1)` | Background color on hover. |
| `--eva-active-chapter-icon-color` | `white` | Color of the chapter icon. |

### Aria Types

**`EvaActiveChaptedAria`**

| Property | Type | Default | Description |
|---|---|---|---|
| `ariaLabel` | `string` | `"Active chapter"` | Accessible label for the button. |

### EvaApi Integration

| API field / method | Usage |
|---|---|
| `EvaApi.isActiveChapterPresent` | Set to `true` on init, `false` on destroy. Controls whether per-frame chapter lookup runs in `updateVideoTime()`. |
| `EvaApi.activeChapterSubject` | Subscribed to on init. Emits the `EvaChapterMarker` at the current playback position, or `null`.