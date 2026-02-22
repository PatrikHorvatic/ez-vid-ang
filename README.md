# EzVidAng (Easy Video Angular)

Highly configurable and easy-to-use Angular component library for video playback and streaming.

## Why to use it?
🚦 **Signal based components** - Granular and optimized render updates<br/>
⚡ **Zoneless** - Built for zoneless Angular applications by default<br/>
🚀 **High performance** – Powered by RxJS; change detection runs only when needed (no zone pollution)<br/>
🎨 **Highly customizable** – Styling variables, custom icons, and fonts. Bring your own assets<br/>
♿ **ARIA compliant** – All components follow ARIA standards and support custom inputs<br/>
🌍 **Multilanguage support** – Configurable text inputs for full localization<br/>
▶️ **Inspired by modern players** – Familiar UX similar to popular platforms<br/>
📱 **Responsive design** - Works across all screen sizes and devices<br/>


## Version compatibility

EzVidAng follows the _[actively supported versions](https://angular.dev/reference/releases#actively-supported-versions)_ defined by the Angular team. When an Angular version reaches end of support, the corresponding EzVidAng version will no longer be maintained.

| EzVidAng    | Angular    | Node.js                           |
| ----------- | ---------- | --------------------------------- |
| ^19.0.0     | ^19.0.0    | [According to Angular docs](https://angular.dev/reference/releases#actively-supported-versions)    |
| ^20.0.0     | ^20.0.0    | [According to Angular docs](https://angular.dev/reference/releases#actively-supported-versions)    |
| ^21.0.0     | ^21.0.0    | [According to Angular docs](https://angular.dev/reference/releases#actively-supported-versions)    |


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
<br/>

Import the needed modules into your standalone component or NgModule:
```
import { Component } from '@angular/core';
import { EvaBufferingModule, EvaControlsModule, EvaCoreModule, EvaStreamingModule } from 'ez-vid-ang';

@Component({
  selector: 'lt-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  imports: [
    EvaCoreModule,
    EvaControlsModule,
    EvaBufferingModule,
    EvaStreamingModule
  ]
})
export class HomePage {}

```

## Modules

Library has four logically grouped modules. You can click on the name to go to the documentation:
- [**EvaCoreModule**](documentation/core) – Main player component, directives, and providers
- [**EvaControlsModule**](documentation/controls) – Video control components and pipes
- [**EvaBufferingModule**](documentation/buffering) – Loading and buffering indicators
- [**EvaStreamingModule**](documentation/streaming) – Directives for live streaming support
