import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EvaFullscreenAPI {
  private isFullscreenSubject = new BehaviorSubject<boolean>(false);
  public isFullscreenObs: Observable<boolean> = this.isFullscreenSubject.asObservable();

  private polyfill: any;
  private nativeFullscreen = true;
  private isAvailable = false;

  constructor() {
    this.detectFullscreenAPI();
  }

  /**
   * Detect which fullscreen API is available
   */
  private detectFullscreenAPI(): void {
    const APIs = {
      w3: {
        enabled: 'fullscreenEnabled',
        element: 'fullscreenElement',
        request: 'requestFullscreen',
        exit: 'exitFullscreen',
        onchange: 'fullscreenchange',
        onerror: 'fullscreenerror',
      },
      newWebkit: {
        enabled: 'webkitFullscreenEnabled',
        element: 'webkitFullscreenElement',
        request: 'webkitRequestFullscreen',
        exit: 'webkitExitFullscreen',
        onchange: 'webkitfullscreenchange',
        onerror: 'webkitfullscreenerror',
      },
      oldWebkit: {
        enabled: 'webkitIsFullScreen',
        element: 'webkitCurrentFullScreenElement',
        request: 'webkitRequestFullScreen',
        exit: 'webkitCancelFullScreen',
        onchange: 'webkitfullscreenchange',
        onerror: 'webkitfullscreenerror',
      },
      moz: {
        enabled: 'mozFullScreen',
        element: 'mozFullScreenElement',
        request: 'mozRequestFullScreen',
        exit: 'mozCancelFullScreen',
        onchange: 'mozfullscreenchange',
        onerror: 'mozfullscreenerror',
      },
      ios: {
        enabled: 'webkitFullscreenEnabled',
        element: 'webkitFullscreenElement',
        request: 'webkitEnterFullscreen',
        exit: 'webkitExitFullscreen',
        onchange: 'webkitendfullscreen',
        onerror: 'webkitfullscreenerror',
      },
      ms: {
        enabled: 'msFullscreenEnabled',
        element: 'msFullscreenElement',
        request: 'msRequestFullscreen',
        exit: 'msExitFullscreen',
        onchange: 'MSFullscreenChange',
        onerror: 'MSFullscreenError',
      },
    };

    // Detect which API is available
    for (const browser in APIs) {
      if ((APIs as any)[browser].enabled in document) {
        this.polyfill = (APIs as any)[browser];
        break;
      }
    }

    // Special handling for iOS
    if (this.isiOSDevice()) {
      this.polyfill = APIs.ios;
    }

    this.isAvailable = this.polyfill != null;

    // Setup change listeners
    if (this.polyfill) {
      this.setupFullscreenListeners();
    }
  }

  /**
   * Setup listeners for fullscreen change events
   */
  private setupFullscreenListeners(): void {
    let dispatcher: any;

    switch (this.polyfill.onchange) {
      case 'mozfullscreenchange':
        dispatcher = document;
        break;
      default:
        dispatcher = document;
    }

    fromEvent(dispatcher, this.polyfill.onchange).subscribe(() => {
      this.onFullscreenChange();
    });
  }

  /**
   * Handle fullscreen change events
   */
  private onFullscreenChange(): void {
    const isFullscreen = !!(document as any)[this.polyfill.element];
    this.isFullscreenSubject.next(isFullscreen);
  }

  /**
   * Check if fullscreen is currently active
   */
  isFullscreen(): boolean {
    return this.isFullscreenSubject.value;
  }

  /**
   * Check if fullscreen is supported
   */
  isFullscreenSupported(): boolean {
    return this.isAvailable;
  }

  /**
   * Enter fullscreen mode
   */
  async enterFullscreen(element: HTMLElement, videoElement?: HTMLVideoElement): Promise<void> {
    if (!this.isAvailable || !this.nativeFullscreen) {
      console.warn('Fullscreen is not supported');
      return;
    }

    try {
      let targetElement = element;

      // Mobile device handling
      if (this.isMobileDevice()) {
        // iOS devices need to use video element directly
        if (this.isiOSDevice() && videoElement) {
          targetElement = videoElement;
        }
        // Other mobile devices: if no native fullscreen on container, use video
        else if (!this.polyfill.enabled && videoElement) {
          targetElement = videoElement;
        }
      }

      await (targetElement as any)[this.polyfill.request]();
      this.isFullscreenSubject.next(true);
    } catch (error) {
      console.error('Error entering fullscreen:', error);
      throw error;
    }
  }

  /**
   * Exit fullscreen mode
   */
  async exitFullscreen(): Promise<void> {
    if (!this.isAvailable || !this.nativeFullscreen) {
      return;
    }

    try {
      await (document as any)[this.polyfill.exit]();
      this.isFullscreenSubject.next(false);
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
      throw error;
    }
  }

  /**
   * Toggle fullscreen mode
   */
  async toggleFullscreen(element: HTMLElement, videoElement?: HTMLVideoElement): Promise<void> {
    if (this.isFullscreen()) {
      await this.exitFullscreen();
    } else {
      await this.enterFullscreen(element, videoElement);
    }
  }

  /**
   * Check if device is mobile
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if device is iOS
   */
  private isiOSDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }
}
