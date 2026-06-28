# EzVidAng (Easy Video Angular)

Highly configurable, performant and easy-to-use Angular component library for video playback and streaming.

## Why to use it?
🚦 **Signal based components** - Granular and optimized render updates<br/>
⚡ **Zoneless** - Built for zoneless Angular applications by default<br/>
🧩 **Standalone architecture** – No NgModules required; simpler imports, better tree-shaking, and improved DX<br/>
🚀 **High performance** – Powered by RxJS; change detection runs only when needed (no zone pollution)<br/>
🎨 **Highly customizable** – 200+ CSS variables, custom icons, and fonts. Bring your own assets<br/>
♿ **ARIA compliant** – All components follow ARIA standards and support custom inputs<br/>
🌍 **Multilanguage support** – Configurable text inputs for full localization<br/>
▶️ **Inspired by modern players** – Familiar UX similar to popular platforms<br/>
📱 **Responsive design** - Works across all screen sizes and devices<br/>
⚙️ **Settings panel** – YouTube-style navigable settings menu with sub-menus<br/>
⌨️ **Keyboard shortcuts overlay** – Press `?` to show all shortcuts, auto-integrated<br/>
💾 **Configuration storage** – Persist user preferences (volume, speed, loop, cinema mode) to localStorage<br/>
🎬 **Cinema mode** – Dim the page and focus on the video<br/>

## Example project

Example project can be found on [Stackblitz](https://stackblitz.com/edit/stackblitz-starters-sr5wp23n)

## Version compatibility

EzVidAng updates and develops the library for the 2 latest versions.

| EzVidAng    | Angular    | Node.js                           |
| ----------- | ---------- | --------------------------------- |
| ^21.2.x     | ^21.2.x    | [According to Angular docs](https://angular.dev/reference/versions#actively-supported-versions)    |
| ^22.0.0     | ^22.0.0    | [According to Angular docs](https://angular.dev/reference/versions#actively-supported-versions)    |


## Installing and preparation

Install the package:
```
npm i @ez-vid-ang/ez-vid-ang
```
Add the required styles to your angular.json:
```
{
  "projects": {
    "your_project": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "node_modules/ez-vid-ang/assets/eva-required-import.scss",
              "node_modules/ez-vid-ang/assets/eva-icons-and-fonts.scss"
            ]
          }
        }
      }
    }
  }
}
```
> [!NOTE]
> *eva-icons-and-fonts.scss* is optional if you provide custom icons and fonts for all components. It includes a prepared *.woff* file and utility classes for default icon usage.


> [!IMPORTANT]
> **If you want to use HLS streaming directive you must install latest version of the hls.js.**
> 
> ```
> npm i hls.js
>```
> **And add the required script to your angular.json**
> ```
> {
>   "projects": {
>     "your_project": {
>       "architect": {
>         "build": {
>           "options": {
>             "scripts": [
>               "node_modules/hls.js/dist/hls.min.js"
>             ]
>           }
>         }
>       }
>     }
>   }
> }
> ```

> [!IMPORTANT]
> **If you want to use DASH streaming directive you must install v5 of the dash.js.**
> 
> ```
> npm i dashjs
>```
> **And add the required script to your angular.json**
> ```
> {
>   "projects": {
>     "your_project": {
>       "architect": {
>         "build": {
>           "options": {
>             "scripts": [
>               "node_modules/dashjs/dist/modern/esm/dash.all.min.js"
>             ]
>           }
>         }
>       }
>     }
>   }
> }
> ```

Import only the components you need — every component is standalone and tree-shakable:
```typescript
import { Component, signal } from '@angular/core';
import {
  EvaBuffering,
  EvaControlsContainer,
  EvaControlsDivider,
  EvaFullscreen,
  EvaMute,
  EvaOverlayPlay,
  EvaPlayer,
  EvaPlayPause,
  EvaScrubBar,
  EvaScrubBarBufferingTime,
  EvaScrubBarCurrentTime,
  EvaTimeDisplay,
  EvaUserInteractionEventsDirective,
  EvaVideoSource,
  EvaVolume,
} from 'ez-vid-ang';

@Component({
  selector: 'app-player',
  templateUrl: './player.html',
  styleUrl: './player.scss',
  imports: [
    EvaBuffering,
    EvaControlsContainer,
    EvaControlsDivider,
    EvaFullscreen,
    EvaMute,
    EvaOverlayPlay,
    EvaPlayer,
    EvaPlayPause,
    EvaScrubBar,
    EvaScrubBarBufferingTime,
    EvaScrubBarCurrentTime,
    EvaTimeDisplay,
    EvaUserInteractionEventsDirective,
    EvaVolume,
  ],
})
export class PlayerComponent {
  protected readonly sources = signal<EvaVideoSource[]>([
    { type: 'video/mp4', src: '/video.mp4' },
  ]);
}
```

See [Simple Example](documentation/example-simple.md) and [Full-Featured Example](documentation/example-configuration.md) for complete usage.

## Development

### Linting

The project uses a strict ESLint configuration with type-aware TypeScript rules and Angular-specific template rules. All available rule presets are enabled.

```bash
npm run lint        # Check for errors
npx ng lint --fix   # Auto-fix fixable errors
```

All magic numbers are centralized in `src/lib/constants.ts`. See [linting documentation](documentation/core/linting.md) and [constants documentation](documentation/core/constants.md) for details.

## Components

Library has four groups of components. Click on the name to go to the documentation:
- [**EvaCore**](documentation/core) – Main player component, directives (keyboard shortcuts, configuration storage), and providers
- [**EvaControls**](documentation/controls) – Video control components (play/pause, volume, scrub bar, fullscreen, playback speed, quality selector, track selector, loop, picture-in-picture, download, screenshot, context menu, settings panel, keyboard shortcuts overlay, cinema mode, error overlay, chapter list, and more)
- [**EvaBuffering**](documentation/buffering) – Loading and buffering indicators
- [**EvaStreaming**](documentation/streaming) – Directives for HLS and DASH live streaming support

---
### 💖 Support This Project

If you wish to make a donation you can click the widget.
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/K3K01AFMO6)

Your support helps:
- Maintain the project
- Add new features
- Fix bugs
- Provide long-term updates

Thank you for your generosity! 🙏