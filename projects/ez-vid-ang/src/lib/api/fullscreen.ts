import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable, Subscription } from 'rxjs';
import { EvaApi } from './eva-api';

interface FullscreenPolyfill {
  enabled: string;
  element: string;
  request: string;
  exit: string;
  onchange: string;
  onerror: string;
}

/**
 * Service that manages fullscreen state for the Eva video player.
 *
 * Provided at the root level and injected into `EvaPlayer` and `EvaFullscreen`.
 * Abstracts cross-browser and cross-platform fullscreen API differences by detecting
 * the available API variant on construction and routing all fullscreen operations
 * through the appropriate vendor-prefixed methods.
 *
 * Supported API variants (detected in priority order):
 * - `w3` — W3C standard (`requestFullscreen` / `exitFullscreen`)
 * - `newWebkit` — Modern WebKit (`webkitRequestFullscreen`)
 * - `oldWebkit` — Legacy WebKit (`webkitRequestFullScreen`)
 * - `moz` — Firefox (`mozRequestFullScreen`)
 * - `ios` — iOS Safari (`webkitEnterFullscreen` on the video element)
 * - `ms` — Internet Explorer / Edge Legacy (`msRequestFullscreen`)
 *
 * iOS is handled specially — it always uses the `ios` polyfill and targets the
 * `<video>` element directly rather than the player container, since iOS Safari
 * only supports fullscreen on video elements.
 *
 * Fullscreen state is tracked via a `BehaviorSubject` and exposed as `isFullscreenObs`
 * for components to subscribe to. The state is updated on native fullscreen change events
 * and manually after programmatic enter/exit calls.
 *
 * @example
 * // Injected automatically into EvaPlayer — not intended for direct consumer use.
 * // To toggle fullscreen from a component:
 * await this.fullscreenService.toggleFullscreen();
 */
@Injectable()
export class EvaFullscreenAPI {

  private readonly evaAPI = inject(EvaApi);

  /** Internal subject tracking whether the player is currently in fullscreen mode. */
  private readonly isFullscreenSubject = new BehaviorSubject<boolean>(false);

  /** Observable stream of fullscreen state changes. Subscribe to react to enter/exit events. */
  public isFullscreenObs: Observable<boolean> = this.isFullscreenSubject.asObservable();

  /**
   * The detected fullscreen API polyfill object containing vendor-prefixed method and
   * property names for the current browser. `null` if no supported API was found.
   */
  private polyfill: FullscreenPolyfill | null = null;

  /**
   * Whether to use the native fullscreen API.
   * Reserved for future use — currently always `true`.
   */
  private readonly nativeFullscreen = true;

  /** Whether a supported fullscreen API was detected on construction. */
  private isAvailable = false;

  /** Subscription to the native fullscreen change event. Cleaned up in `destroy()`. */
  private fullscreenSub: Subscription | null = null;

  /**
   * Detects the available fullscreen API variant on construction
   * and sets up native fullscreen change event listeners.
   */
  public constructor() {
    this.detectFullscreenAPI();
  }

  /**
   * Detects which fullscreen API variant is available in the current browser
   * by checking for the presence of known `document` properties from each variant.
   *
   * iOS devices are always redirected to the `ios` polyfill regardless of what
   * the property check finds, since iOS requires `webkitEnterFullscreen` on
   * the video element rather than the container.
   *
   * Sets `this.polyfill` to the matched API map and `this.isAvailable` to `true`
   * if a match is found. Attaches fullscreen change listeners if a polyfill is set.
   */
  private detectFullscreenAPI(): void {
    const APIs: Record<string, FullscreenPolyfill> = {
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
    for (const browser of Object.keys(APIs)) {
      if (APIs[browser].enabled in document) {
        this.polyfill = APIs[browser];
        break;
      }
    }

    // Special handling for iOS — always override to the ios polyfill
    if (this.isiOSDevice()) {
      this.polyfill = APIs['ios'];
    }

    this.isAvailable = this.polyfill !== null;

    // Setup change listeners — for non-iOS, attach immediately to document.
    // For iOS, defer until the video element is available via playerReadyEvent.
    if (this.polyfill) {
      if (this.isiOSDevice()) {
        this.evaAPI.playerReadyEvent.subscribe(() => {
          this.setupFullscreenListeners();
        });
      } else {
        this.setupFullscreenListeners();
      }
    }
  }

  private setupFullscreenListeners(): void {
    this.fullscreenSub?.unsubscribe();
    const target = this.isiOSDevice() && this.evaAPI.assignedVideoElement
      ? this.evaAPI.assignedVideoElement
      : document;
    this.fullscreenSub = fromEvent(target, this.polyfill!.onchange).subscribe(() => {
      this.onFullscreenChange();
    });
  }

  /**
   * Called when the native fullscreen change event fires.
   * Reads the current fullscreen element from `document` using the polyfill property name
   * and updates `isFullscreenSubject` accordingly.
   */
  private onFullscreenChange(): void {
    const isFullscreen = Boolean((document as unknown as Record<string, unknown>)[this.polyfill!.element]);
    this.isFullscreenSubject.next(isFullscreen);
  }

  /**
   * Returns whether the player is currently in fullscreen mode.
   * Reads synchronously from `isFullscreenSubject`.
   */
  public isFullscreen(): boolean {
    return this.isFullscreenSubject.value;
  }

  /**
   * Returns whether a supported fullscreen API was detected in the current browser.
   * Can be used to conditionally show or hide the fullscreen button.
   */
  public isFullscreenSupported(): boolean {
    return this.isAvailable;
  }

  /**
   * Requests fullscreen on the given element using the detected browser API.
   *
   * Mobile device handling:
   * - On iOS, always targets the `<video>` element directly via `webkitEnterFullscreen`.
   * - On other mobile devices without native container fullscreen support, falls back
   *   to the `<video>` element if provided.
   *
   * Manually updates `isFullscreenSubject` to `true` on success in addition to
   * the native change event, to ensure the state is immediately reflected.
   *
   * @param element - The player container element to make fullscreen.
   * @param videoElement - The native `<video>` element, used as a fallback on mobile/iOS.
   * @throws Re-throws any error from the native fullscreen request.
   */
  public async enterFullscreen(element: HTMLElement, videoElement?: HTMLVideoElement): Promise<void> {
    if (!this.isAvailable || !this.nativeFullscreen || !this.polyfill) {
      console.warn('Fullscreen is not supported');
      return;
    }

    try {
      let targetElement: HTMLElement = element;

      // Mobile device handling
      if (this.isMobileDevice()) {
        // IOS devices need to use video element directly
        if (this.isiOSDevice() && videoElement) {
          targetElement = videoElement;
        }
        // Other mobile devices: if requestFullscreen is not available on the container, use video
        else if (!(this.polyfill.request in targetElement) && videoElement) {
          targetElement = videoElement;
        }
      }

      await (targetElement as unknown as Record<string, () => Promise<void>>)[this.polyfill.request]();
      this.isFullscreenSubject.next(true);
    } catch (error) {
      console.warn('Error entering fullscreen:', error);
      throw error;
    }
  }

  /**
   * Exits fullscreen mode by calling the polyfill's exit method on `document`.
   * Manually updates `isFullscreenSubject` to `false` on success.
   *
   * No-ops if fullscreen is not available or `nativeFullscreen` is disabled.
   *
   * @throws Re-throws any error from the native fullscreen exit call.
   */
  public async exitFullscreen(): Promise<void> {
    if (!this.isAvailable || !this.nativeFullscreen || !this.polyfill) {
      return;
    }

    try {
      if (this.isiOSDevice() && this.evaAPI.assignedVideoElement) {
        (this.evaAPI.assignedVideoElement as unknown as Record<string, () => void>)[this.polyfill.exit]();
      } else {
        await (document as unknown as Record<string, () => Promise<void>>)[this.polyfill.exit]();
      }
      this.isFullscreenSubject.next(false);
    } catch (error) {
      console.warn('Error exiting fullscreen:', error);
      throw error;
    }
  }

  /**
   * Toggles fullscreen mode — exits if currently fullscreen, enters otherwise.
   * Resolves the video element and player container internally via `EvaApi.assignedVideoElement`.
   */
  public async toggleFullscreen(): Promise<void> {
    const videoElement = this.evaAPI.assignedVideoElement;
    if (!videoElement) {
      console.warn('Video element not assigned');
      return;
    }
    const playerContainer = videoElement.closest<HTMLElement>('eva-player');
    if (!playerContainer) {
      console.warn('Player container not found');
      return;
    }
    if (this.isFullscreen()) {
      await this.exitFullscreen();
    } else {
      await this.enterFullscreen(playerContainer, videoElement);
    }
  }

  /**
   * Returns whether the current device is a mobile device, based on `navigator.userAgent`.
   * Used to determine whether to target the `<video>` element instead of the container.
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/iu.test(navigator.userAgent);
  }

  /**
   * Returns whether the current device is running iOS (iPhone, iPad, or iPod),
   * excluding IE/Edge on Windows (which can falsely match some patterns).
   * Used to force the `ios` polyfill and target the `<video>` element directly.
   */
  private isiOSDevice(): boolean {
    return (/iPad|iPhone|iPod/u.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
      !('MSStream' in window);
  }

  /**
 * Cleans up all resources held by this `EvaFullscreenAPI` instance.
 * Called from `EvaPlayer.ngOnDestroy`.
 *
 * Performs the following cleanup:
 * - Unsubscribes from the native fullscreen change event on `document` to prevent
 *   the listener from firing after the player has been destroyed.
 * - Completes `isFullscreenSubject` so subscribers receive a completion signal.
 */
  public destroy(): void {
    this.fullscreenSub?.unsubscribe();
    this.isFullscreenSubject.complete();
  }
}