# Constants

**File:** `src/lib/constants.ts`

All magic numbers used throughout the library are centralized in a single constants file. Every value is a module-level `const` and cannot be reassigned. Components import only the constants they need.

## Time Conversion

| Constant | Value | Description |
|----------|-------|-------------|
| `SECONDS_PER_HOUR` | `3600` | Used in time formatting (`formatTime`) across scrub bar, time display, and chapter list. |
| `SECONDS_PER_MINUTE` | `60` | Used in time formatting for minute extraction. |
| `TIME_DISPLAY_PAD_WIDTH` | `2` | Width passed to `padStart()` for zero-padded time segments (e.g. `"07"`). |

## Percentage Math

| Constant | Value | Description |
|----------|-------|-------------|
| `PERCENTAGE` | `100` | Multiplier/divisor for converting between 0–1 normalized values and 0–100 percentages. Used in volume, scrub bar, and buffering calculations. |
| `SCRUB_BAR_MAX_SEEK_PERCENT` | `99.9` | Maximum seek percentage clamp. Prevents seeking to the absolute end of a video which can trigger premature `ended` events. |

## Volume

| Constant | Value | Description |
|----------|-------|-------------|
| `DEFAULT_LOW_VOLUME_THRESHOLD` | `0.25` | Default threshold for the low-volume icon in `EvaMute`. |
| `DEFAULT_MIDDLE_VOLUME_THRESHOLD` | `0.75` | Default threshold for the high-volume icon in `EvaMute`. |
| `DEFAULT_UNMUTE_VOLUME` | `0.75` | Fallback volume when unmuting and `lastActiveVolume` is `0`. |
| `VOLUME_ARROW_KEY_STEP` | `5` | Volume change (%) per `ArrowUp`/`ArrowDown` keypress in `EvaVolume`. |
| `VOLUME_PAGE_KEY_STEP` | `10` | Volume change (%) per `PageUp`/`PageDown` keypress in `EvaVolume`. |

## Seek Duration

| Constant | Value | Description |
|----------|-------|-------------|
| `DEFAULT_SEEK_SECONDS` | `10` | Default seconds for `EvaForward`/`EvaBackward` input and fallback in aria-utilities. |
| `SEEK_ICON_THRESHOLD_30` | `30` | Value matched against seek seconds to apply the 30-second icon class. Also used as the FPS divisor for frame-step duration. |
| `DEFAULT_ARROW_SEEK_SECONDS` | `5` | Default seconds for `EvaApi.seekForward()`/`seekBack()` keyboard arrow seek. |

## Number Key Seek

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_DIGIT_KEY` | `9` | Upper bound for number key seek (keys `0`–`9`). |
| `DIGIT_DIVISOR` | `10` | Divisor to convert a digit to a percentage of total duration. |

## Playback Speed

| Constant | Value | Description |
|----------|-------|-------------|
| `MIN_PLAYBACK_SPEED` | `0.25` | Minimum accepted playback speed. Values below this fall back to `1.0`. |
| `MAX_PLAYBACK_SPEED` | `4` | Maximum accepted playback speed. Values above this fall back to `1.0`. |

## Buffering Detection

| Constant | Value | Description |
|----------|-------|-------------|
| `READY_STATE_HAVE_FUTURE_DATA` | `3` | `HTMLMediaElement.readyState` threshold. Corresponds to `HAVE_FUTURE_DATA` or higher. |
| `BUFFERING_DETECTION_DELAY_MS` | `500` | Delay before declaring the video is buffering, to avoid false positives from brief stalls. |

## Timeouts and Debounces (milliseconds)

| Constant | Value | Description |
|----------|-------|-------------|
| `DEFAULT_AUTOHIDE_TIMEOUT_MS` | `3000` | Default auto-hide timeout for controls container and scrub bar. |
| `VOLUME_ANNOUNCE_DEBOUNCE_MS` | `300` | Debounce delay for screen reader volume announcements. |
| `VOLUME_ANNOUNCE_RESET_MS` | `100` | Reset delay after a screen reader announcement. |
| `POST_DRAG_CLICK_SUPPRESS_MS` | `10` | Delay to suppress click events after a drag operation ends. |
| `SCREEN_READER_ANNOUNCEMENT_DURATION_MS` | `1000` | Duration a screen reader announcement element stays in the DOM. |
| `BUFFER_UPDATE_THROTTLE_MS` | `2000` | Throttle interval for buffer percentage updates during playback. |
| `CLICK_OUTSIDE_DEBOUNCE_MS` | `50` | Debounce to ignore the click that opened a panel. |
| `MOUSEMOVE_THROTTLE_MS` | `100` | Throttle interval for mousemove events on the video element. |
| `CHAPTER_UPDATE_DEBOUNCE_MS` | `300` | Debounce delay for chapter marker updates during playback. |

## UI Layout

| Constant | Value | Description |
|----------|-------|-------------|
| `SCRUB_BAR_TOOLTIP_HALF_WIDTH_PX` | `35` | Half-width of the hover time tooltip, used to clamp horizontal positioning. |
