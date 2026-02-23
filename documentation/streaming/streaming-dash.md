## EvaDashDirective

A directive that integrates dash.js into the Eva video player. Applied directly on `<eva-player>`, it uses `EvaApi.assignedVideoElement` internally to attach dash.js to the player's `<video>` element once the player signals readiness.

After the stream initializes, the directive registers its quality levels and setter function with `EvaApi` — making quality switching available to `EvaQualitySelector` without any direct coupling between the two. DRM-protected streams are supported via `evaDashDRMLicenseServer`.

DASH streaming is fully optional. If this directive is absent, `EvaPlayer` falls back to sources provided via `evaVideoSources`.

> [!IMPORTANT]
> **Prerequisite:** dash.js must be available globally. Install via `npm install dashjs` and include it in your build, or load from a CDN.

### Selector

```
eva-player[evaDash]
```

### Usage

```html
<!-- Without DASH — standard source playback -->
<eva-player
  id="my-player"
  [evaVideoSources]="sources"
/>

<!-- With DASH -->
<eva-player
  evaDash
  id="my-player"
  [evaVideoSources]="[]"
  evaDashSrc="https://example.com/stream.mpd"
/>

<!-- With DRM protection -->
<eva-player
  evaDash
  id="my-player"
  [evaVideoSources]="[]"
  evaDashSrc="https://example.com/stream.mpd"
  evaDashDRMToken="Bearer my-token"
  [evaDashDRMLicenseServer]="{
    'com.widevine.alpha': { serverURL: 'https://license.example.com' }
  }"
/>

<!-- With quality selector — no extra wiring needed -->
<eva-player
  evaDash
  id="my-player"
  [evaVideoSources]="[]"
  evaDashSrc="https://example.com/stream.mpd"
/>
<eva-controls-container>
  <eva-quality-selector />
</eva-controls-container>
```

### Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaDashSrc` | `string` | ✅ Yes | — | URL of the DASH stream manifest (`.mpd`). Changing this at runtime destroys the current instance and creates a new one. |
| `evaDashDRMToken` | `string` | No | `undefined` | Authorization token injected into DRM license request headers. Only used when `evaDashDRMLicenseServer` is also provided. |
| `evaDashDRMLicenseServer` | `EvaDRMLicenseServer` | No | `undefined` | DRM license server configuration. Keys are DRM system strings (e.g. `"com.widevine.alpha"`). See `EvaDRMLicenseServer` below. |

### EvaApi Integration

After `STREAM_INITIALIZED` the directive calls two `EvaApi` methods:

| `EvaApi` method | What it does |
|---|---|
| `registerQualityLevels(levels)` | Broadcasts parsed video quality levels to `qualityLevelsSubject` so `EvaQualitySelector` can populate its dropdown. |
| `registerQualityFn(fn)` | Registers `setQualityLevel()` as the active quality setter so `EvaApi.setQuality()` knows how to switch levels. |

### Public Methods

Accessible via a template reference variable using `exportAs: 'evaDash'`.

```html
<eva-player evaDash #dashRef="evaDash" ... />
```

| Method | Signature | Description |
|---|---|---|
| `setQualityLevel` | `(qualityIndex: number) => void` | Switches to the given quality level. Pass `-1` to restore Auto (ABR) mode. Called internally by `EvaApi.setQuality()`. |
| `getDashInstance` | `() => any \| null` | Returns the raw dash.js instance for advanced use. Returns `null` if not initialized. |


### Quality Switching Behaviour

| `qualityIndex` | Behaviour |
|---|---|
| `-1` | Restores Auto (ABR) mode — re-enables `autoSwitchBitrate` for video. |
| `>= 0` | Disables ABR and calls `setQualityFor('video', index)` directly. |


### `EvaDRMLicenseServer`

```ts
interface EvaDRMLicenseServer {
  [drmSystem: string]: {
    serverURL: string;
    httpRequestHeaders?: { [key: string]: string };
  };
}
```

Common DRM system strings:

| DRM System | Key |
|---|---|
| Widevine | `"com.widevine.alpha"` |
| PlayReady | `"com.microsoft.playready"` |
| FairPlay | `"com.apple.fps.1_0"` |


### Fallback Behaviour

| Condition | Behaviour |
|---|---|
| Source includes `.mpd` or `mpd-time-csf` | Creates a dash.js instance and registers quality levels with `EvaApi`. |
| Source does not match DASH pattern | No player is created. |