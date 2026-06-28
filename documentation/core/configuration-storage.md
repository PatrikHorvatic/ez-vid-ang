# Configuration Storage

Persists user preferences (volume, playback speed) to `localStorage` and restores them automatically when the player initializes.

### How It Works

The feature is split into two parts:

- **`EvaConfigurationStorage`** (service) — low-level read/write to `localStorage`. Provided at the component level by `EvaPlayer`.
- **`ConfigurationStorage`** (directive) — applied on the `<video>` element inside `EvaPlayer`. Manages subscriptions and restore logic.

Both are internal — consumers interact with this feature through `EvaPlayer` inputs only.

### Inputs

All inputs are set on `<eva-player>`:

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `evaLocalStorageEnabled` | `boolean` | No | `false` | Master toggle. When `false`, nothing is saved or restored. |
| `evaLocalStorageConfiguration` | `EvaStorageConfiguration` | No | `{ volume: false, playbackSpeed: false }` | Granular flags for which preferences to persist. Can be changed at runtime. |

### `EvaStorageConfiguration`

| Property | Type | Default | Description |
|---|---|---|---|
| `volume` | `boolean` | `false` | Persist the user's volume across sessions. |
| `playbackSpeed` | `boolean` | `false` | Persist the user's playback speed across sessions. |

### localStorage Keys

Values are stored under a namespaced key prefix (default `EVA_PLAYER_CONFIGURATION`):

| Preference | Key | Value format |
|---|---|---|
| Volume | `{prefix}_volume` | `"0"` – `"1"` (normalized float) |
| Playback speed | `{prefix}_playbackSpeed` | `"0.5"`, `"1"`, `"1.5"`, etc. |

The default prefix is `EVA_PLAYER_CONFIGURATION`. Override via the `evaLocalStorageKey` input on `<eva-player>`.

All `localStorage` access is wrapped in try-catch. In restricted environments (private browsing on some older browsers, sandboxed iframes, quota exceeded), saves silently no-op and reads return `null`, falling back to defaults.

### Usage

```html
<!-- Persist volume only -->
<eva-player
  id="my-player"
  [evaVideoSources]="sources()"
  [evaLocalStorageEnabled]="true"
  [evaLocalStorageConfiguration]="{ volume: true }"
/>

<!-- Persist both volume and playback speed -->
<eva-player
  id="my-player"
  [evaVideoSources]="sources()"
  [evaLocalStorageEnabled]="true"
  [evaLocalStorageConfiguration]="{ volume: true, playbackSpeed: true }"
/>

<!-- Persist playback speed only -->
<eva-player
  id="my-player"
  [evaVideoSources]="sources()"
  [evaLocalStorageEnabled]="true"
  [evaLocalStorageConfiguration]="{ playbackSpeed: true }"
/>

<!-- Toggle persistence at runtime -->
<eva-player
  id="my-player"
  [evaVideoSources]="sources()"
  [evaLocalStorageEnabled]="isPersistenceEnabled()"
  [evaLocalStorageConfiguration]="storageConfig()"
/>
```

### Priority Order

When a video loads, preferences are applied in this order:

1. **Browser default** — `volume: 1`, `playbackRate: 1`.
2. **`evaVideoConfiguration`** — e.g. `{ startingVolume: 0.3 }` overrides the browser default.
3. **localStorage** — the saved user preference overrides both. If nothing is saved, step 2's value is kept.

The user's last choice always wins over the developer's configured default.

### Mute Behaviour

Volume `0` (muted state) is **not** persisted. Only non-zero volume values are saved. This prevents the player from starting muted on the next visit when the user only intended a temporary mute.

### Runtime Configuration Changes

Individual features can be toggled at runtime by changing `evaLocalStorageConfiguration`:

- Setting `volume: true` → creates a subscription to volume changes and starts saving.
- Setting `volume: false` → tears down the subscription. The last saved value remains in `localStorage`.
- Setting `evaLocalStorageEnabled: false` → tears down all subscriptions immediately.
- Setting `evaLocalStorageEnabled: true` again → restores saved values and re-creates subscriptions.

### Multi-Player Support

Each player can use a different `evaLocalStorageKey` to store preferences independently. By default, all players share the same key prefix (`EVA_PLAYER_CONFIGURATION`), so they share preferences.

```html
<!-- Player 1 — uses default key -->
<eva-player
  id="player-1"
  [evaVideoSources]="sources1()"
  [evaLocalStorageEnabled]="true"
  [evaLocalStorageConfiguration]="{ volume: true }"
/>

<!-- Player 2 — isolated preferences -->
<eva-player
  id="player-2"
  [evaVideoSources]="sources2()"
  [evaLocalStorageEnabled]="true"
  [evaLocalStorageConfiguration]="{ volume: true }"
  evaLocalStorageKey="PLAYER_2_CONFIG"
/>
```
