## EvaHlsDirective

A directive that integrates hls.js into the Eva video player. Applied directly on `<eva-player>`, it uses `EvaApi.assignedVideoElement` internally to attach hls.js to the player's `<video>` element once the player signals readiness.

After the manifest is parsed, the directive registers its quality levels and setter function with `EvaApi` — making quality switching available to `EvaQualitySelector` without any direct coupling between the two.

HLS streaming is fully optional. If this directive is absent, `EvaPlayer` falls back to sources provided via `evaVideoSources`.

> [!IMPORTANT]
> **Prerequisite:** hls.js must be available globally. Install via `npm install hls.js` and include it in your build, or load it from a CDN.

### Selector

```
eva-player[evaHls]
```

### Usage

```html
<!-- Without HLS — standard source playback -->
<eva-player
  id="my-player"
  [evaVideoSources]="sources"
/>

<!-- With HLS -->
<eva-player
  evaHls
  id="my-player"
  [evaVideoSources]="[]"
  evaHlsSrc="https://example.com/stream.m3u8"
/>

<!-- With custom headers and config -->
<eva-player
  evaHls
  id="my-player"
  [evaVideoSources]="[]"
  evaHlsSrc="https://example.com/stream.m3u8"
  [evaHlsHeaders]="{ Authorization: 'Bearer token' }"
  [evaHlsConfig]="{ maxBufferLength: 30 }"
/>

<!-- With quality selector — no extra wiring needed -->
<eva-player
  evaHls
  id="my-player"
  [evaVideoSources]="[]"
  evaHlsSrc="https://example.com/stream.m3u8"
/>
<eva-controls-container>
  <eva-quality-selector />
</eva-controls-container>
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaHlsSrc` | `string` | ✅ Yes | — | URL of the HLS stream manifest (`.m3u8`). Changing this at runtime destroys the current instance and creates a new one. |
| `evaHlsHeaders` | `{ [key: string]: string }` | No | `{}` | HTTP headers attached to every segment request via hls.js `xhrSetup`. |
| `evaHlsConfig` | `EvaHlsConfig` | No | `{}` | hls.js configuration overrides merged with the directive's defaults. |

### EvaApi Integration

After `MANIFEST_PARSED` the directive calls two `EvaApi` methods:

| `EvaApi` method | What it does |
|---|---|
| `registerQualityLevels(levels)` | Broadcasts parsed quality levels to `qualityLevelsSubject` so `EvaQualitySelector` can populate its dropdown. |
| `registerQualityFn(fn)` | Registers `setQualityLevel()` as the active quality setter so `EvaApi.setQuality()` knows how to switch levels. |

This means `EvaQualitySelector` never imports or knows about `EvaHlsDirective`. All communication goes through `EvaApi`.

### Public Methods

Accessible via a template reference variable using `exportAs: 'evaHls'`.

```html
<eva-player evaHls #hlsRef="evaHls" ... />
```

| Method | Signature | Description |
|---|---|---|
| `setQualityLevel` | `(level: number) => void` | Switches to the given quality level index. Pass `-1` for Auto (ABR) mode. Called internally by `EvaApi.setQuality()`. |
| `getHlsInstance` | `() => any \| null` | Returns the raw hls.js instance for advanced use. Returns `null` if not initialized. |

### `EvaHlsConfig`

| Property | Type | Description |
|---|---|---|
| `autoStartLoad` | `boolean` | When `false`, hls.js will not load segments until `hls.startLoad()` is called. |
| `xhrSetup` | `(xhr: XMLHttpRequest, url: string) => void` | Custom XHR setup. Note: `evaHlsHeaders` is the preferred way to add request headers. |
| `maxBufferLength` | `number` | Maximum buffer length in seconds. |
| `maxBufferSize` | `number` | Maximum buffer size in bytes. |

For a full list of options refer to the [hls.js API documentation](https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning).

### Fallback Behaviour

| Condition | Behaviour |
|---|---|
| hls.js is supported | Creates an hls.js instance, attaches it to the video element, and registers quality levels with `EvaApi`. |
| Native HLS supported (e.g. Safari) | Sets `src` directly on the video element. No quality levels are registered. |
| Neither supported | Logs a warning to the console. |