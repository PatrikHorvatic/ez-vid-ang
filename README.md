# EzVidAng (Easy Video Angular)

Highly configurable, performant and easy-to-use Angular component library for video playback and streaming.

## Why to use it?
🚦 **Signal based components** - Granular and optimized render updates<br/>
⚡ **Zoneless** - Built for zoneless Angular applications by default<br/>
🧩 **Standalone architecture** – No NgModules required; simpler imports, better tree-shaking, and improved DX<br/>
🚀 **High performance** – Powered by RxJS; change detection runs only when needed (no zone pollution)<br/>
🎨 **Highly customizable** – Styling variables, custom icons, and fonts. Bring your own assets<br/>
♿ **ARIA compliant** – All components follow ARIA standards and support custom inputs<br/>
🌍 **Multilanguage support** – Configurable text inputs for full localization<br/>
▶️ **Inspired by modern players** – Familiar UX similar to popular platforms<br/>
📱 **Responsive design** - Works across all screen sizes and devices<br/>

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

Import the needed components and types into your standalone component or NgModule:
```
import { Component } from '@angular/core';
import {
  EvaActiveChapter,
  EvaBackward,
  EvaBuffering,
  EvaChapterMarker,
  EvaOverlayPlay,
  EvaControlsContainer, EvaControlsDivider,
  EvaForward, EvaFullscreen, EvaHlsDirective,
  EvaMute, EvaMuteAria, EvaPlaybackSpeed, EvaPlayer,
  EvaPlayPause, EvaQualitySelector, EvaScrubBar,
  EvaScrubBarBufferingTime, EvaScrubBarCurrentTime,
  EvaSubtitleDisplay,EvaPictureInPicture,
  EvaTimeDisplay, EvaTrack, EvaTrackSelector,
  EvaVideoElementConfiguration, EvaVideoSource, EvaVolume
} from "ez-vid-ang";

@Component({
  selector: 'lt-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  imports: [
EvaActiveChapter,
    EvaBackward,
    EvaBuffering,
    EvaOverlayPlay,
    EvaControlsContainer,
    EvaControlsDivider,
    EvaForward,
    EvaFullscreen,
    EvaHlsDirective,
    EvaMute,
    EvaPlaybackSpeed,
    EvaPlayer,
    EvaPlayPause,
    EvaPictureInPicture,
    EvaQualitySelector,
    EvaScrubBar,
    EvaScrubBarBufferingTime,
    EvaScrubBarCurrentTime,
    EvaSubtitleDisplay,
    EvaTimeDisplay, 
    EvaTrackSelector,
    EvaVolume
  ]
})
export class HomePage {}

```

## Development

### Linting

The project uses a strict ESLint configuration with type-aware TypeScript rules and Angular-specific template rules. All available rule presets are enabled.

```bash
npm run lint        # Check for errors
npx ng lint --fix   # Auto-fix fixable errors
```

All magic numbers are centralized in `src/lib/constants.ts`. See [linting documentation](documentation/core/linting.md) and [constants documentation](documentation/core/constants.md) for details.

## Components

Library has four groups of components. You can click on the name to go to the documentation:
- [**EvaCore**](documentation/core) – Main player component, directives, and providers
- [**EvaControls**](documentation/controls) – Video control components and pipes
- [**EvaBuffering**](documentation/buffering) – Loading and buffering indicators
- [**EvaStreaming**](documentation/streaming) – Directives for live streaming support

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