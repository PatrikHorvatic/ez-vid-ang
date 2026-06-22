## EvaChapterList

A floating panel that displays all available chapters in a scrollable list. Positioned in the top corner of the video element (same overlay layer as `eva-overlay-play`), above all other player UI (`z-index: 1100`). Opens and closes via the `evaChapterListOpen` input, which can be toggled at runtime (e.g. from `EvaActiveChapter`'s click event). Clicking a chapter seeks the video to that position. The currently active chapter is highlighted automatically.

Chapters are sourced from `EvaApi.chapterMarkerChangesSubject`, which is populated either from the `evaChapters` input on the scrub bar or from VTT chapter tracks.

The component must be placed as a direct child of `<eva-player>` (not inside `<eva-controls-container>`).

### Selector

```html
<eva-chapter-list />
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaChapterListOpen` | `boolean` | No | `false` | Whether the panel is open. Toggle at runtime to show/hide. |
| `evaChapterListTitle` | `string` | No | `"Chapters"` | Title displayed at the top of the panel. |
| `evaChapterListPosition` | `'left' \| 'right'` | No | `"right"` | Which top corner of the player the panel appears in. |
| `evaChapterListEmptyText` | `string` | No | `"No chapters available"` | Text shown when no chapters are available. |

### Outputs

| Output | Type | Description |
|---|---|---|
| `evaChapterListClose` | `void` | Emitted when the user clicks the close button. The consumer should set `evaChapterListOpen` to `false`. |

### Usage

```html
<!-- Toggle via EvaActiveChapter click, close via close button -->
<eva-player id="my-player" [evaVideoSources]="sources">
  <eva-chapter-list
    [evaChapterListOpen]="isChapterListOpen()"
    (evaChapterListClose)="isChapterListOpen.set(false)"
  />

  <eva-scrub-bar [evaShowChapters]="true" [evaChapters]="chapters">
    <eva-scrub-bar-buffering-time />
    <eva-scrub-bar-current-time />
  </eva-scrub-bar>

  <eva-controls-container evaUserInteractionEvents [evaAutohide]="true">
    <eva-play-pause />
    <eva-active-chapter (evaChapterClicked)="toggleChapterList()" />
    <eva-controls-divider />
    <eva-fullscreen />
  </eva-controls-container>
</eva-player>
```

```typescript
// In the component
isChapterListOpen = signal(false);

toggleChapterList() {
  this.isChapterListOpen.update(v => !v);
}
```

```html
<!-- Left-side panel with custom title and empty text -->
<eva-chapter-list
  [evaChapterListOpen]="isChapterListOpen()"
  (evaChapterListClose)="isChapterListOpen.set(false)"
  evaChapterListTitle="Table of Contents"
  evaChapterListPosition="left"
  evaChapterListEmptyText="No sections found"
/>

<!-- Standalone toggle button (without EvaActiveChapter) -->
<eva-controls-container>
  <eva-play-pause />
  <button (click)="toggleChapterList()">Chapters</button>
  <eva-fullscreen />
</eva-controls-container>
```

### Chapter Item Display

Each chapter item shows:
- **Start time** — formatted as `mm:ss` or `HH:mm:ss` for videos over 1 hour.
- **Title** — the chapter title from `EvaChapterMarker.title`. Truncated with ellipsis if too long.
- **Duration** — the length of the chapter segment (`endTime - startTime`), formatted the same way.

The currently playing chapter is highlighted with a distinct background and text color.

The panel header includes a close button (×) that emits `evaChapterListClose` when clicked.

### Edge Cases

| Condition | Behaviour |
|---|---|
| No chapters available | Displays `evaChapterListEmptyText`. Count badge is hidden. |
| Empty `chapter.title` | Falls back to `"Untitled"`. |
| `endTime ≤ startTime` | Duration is hidden for that chapter item. |
| `NaN` or negative `startTime` | Displayed as `"00:00"`. Seek is blocked. |
| `assignedVideoElement` not yet assigned | Seek is a no-op. |
| Active chapter matching | Uses `startTime` comparison (not reference equality), so chapters work correctly even when the array is recreated. |

### Keyboard Support

| Key | Action |
|---|---|
| `Enter` | Seek to the focused chapter |
| `Space` | Seek to the focused chapter |
| `Escape` | Close the chapter list panel |
| `Tab` | Move focus between chapter items |

### Dismissal

The chapter list can be closed by:
- Clicking the **close button** (×) in the header.
- Pressing **Escape** anywhere on the page.
- **Clicking outside** the chapter list panel.

All three emit `evaChapterListClose`.

### SCSS Variables

| Variable | Default | Description |
|---|---|---|
| `--eva-chapter-list-width` | `280px` | Width of the panel. |
| `--eva-chapter-list-max-width` | `40%` | Maximum width relative to the player. |
| `--eva-chapter-list-max-width-mobile` | `60%` | Maximum width on screens ≤ 768px. On screens ≤ 480px the panel takes full width. |
| `--eva-chapter-list-max-height` | `calc(100% - var(--eva-control-element-height) - 24px)` | Maximum height. Defaults to leaving room for the controls bar. |
| `--eva-chapter-list-top` | `8px` | Distance from the top edge of the player. |
| `--eva-chapter-list-offset` | `8px` | Distance from the left or right edge of the player. |
| `--eva-chapter-list-background` | `rgba(0, 0, 0, 0.92)` | Panel background color. |
| `--eva-chapter-list-border-radius` | `8px` | Border radius of the panel. |
| `--eva-chapter-list-box-shadow` | `0 8px 32px rgba(0,0,0,0.5), ...` | Box shadow of the panel. |
| `--eva-chapter-list-header-padding` | `12px 16px` | Padding of the header area. |
| `--eva-chapter-list-title-font-size` | `14px` | Font size of the panel title. |
| `--eva-chapter-list-title-color` | `rgba(255, 255, 255, 0.9)` | Color of the panel title. |
| `--eva-chapter-list-close-size` | `28px` | Size of the close button. |
| `--eva-chapter-list-close-color` | `rgba(255, 255, 255, 0.6)` | Color of the close button icon. |
| `--eva-chapter-list-count-font-size` | `12px` | Font size of the chapter count badge. |
| `--eva-chapter-list-count-color` | `rgba(255, 255, 255, 0.5)` | Color of the chapter count badge text. |
| `--eva-chapter-list-count-background` | `rgba(255, 255, 255, 0.1)` | Background of the chapter count badge. |
| `--eva-chapter-list-items-padding` | `4px` | Padding around the chapter list. |
| `--eva-chapter-list-scrollbar-color` | `rgba(255, 255, 255, 0.2)` | Scrollbar thumb color. |
| `--eva-chapter-list-item-gap` | `12px` | Gap between time and info inside an item. |
| `--eva-chapter-list-item-padding` | `10px 12px` | Padding inside each chapter item. |
| `--eva-chapter-list-item-hover-background` | `rgba(255, 255, 255, 0.1)` | Background on hover. |
| `--eva-chapter-list-item-active-background` | `rgba(59, 130, 246, 0.25)` | Background of the active chapter. |
| `--eva-chapter-list-item-active-title-color` | `rgb(59, 130, 246)` | Title color of the active chapter. |
| `--eva-chapter-list-item-active-time-color` | `rgb(59, 130, 246)` | Time color of the active chapter. |
| `--eva-chapter-list-item-time-font-size` | `12px` | Font size of chapter start times. |
| `--eva-chapter-list-item-time-color` | `rgba(255, 255, 255, 0.6)` | Color of chapter start times. |
| `--eva-chapter-list-item-title-font-size` | `14px` | Font size of chapter titles. |
| `--eva-chapter-list-item-title-color` | `rgba(255, 255, 255, 0.95)` | Color of chapter titles. |
| `--eva-chapter-list-item-duration-font-size` | `11px` | Font size of chapter durations. |
| `--eva-chapter-list-item-duration-color` | `rgba(255, 255, 255, 0.4)` | Color of chapter durations. |
| `--eva-chapter-list-empty-font-size` | `13px` | Font size of the empty state text. |
| `--eva-chapter-list-empty-color` | `rgba(255, 255, 255, 0.4)` | Color of the empty state text. |
