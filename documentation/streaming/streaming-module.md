## EvaStreamingModule

The `NgModule` that declares and exports the Eva streaming directives. Import this module to enable optional HLS and DASH streaming support in your application.

### Usage

```ts
import { EvaStreamingModule } from 'eva-player';

@NgModule({
  imports: [EvaStreamingModule]
})
export class AppModule { }
```

### Exported Members

| Member | Type | Description |
|---|---|---|
| `EvaHlsDirective` | Directive | Integrates hls.js for HLS stream playback and registers quality levels with `EvaApi`. |
| `EvaDashDirective` | Directive | Integrates dash.js for DASH stream playback with optional DRM support. Registers quality levels with `EvaApi`. |

Both directives are independent — import only `EvaStreamingModule` regardless of which protocol you use. The unused directive will simply never be applied.