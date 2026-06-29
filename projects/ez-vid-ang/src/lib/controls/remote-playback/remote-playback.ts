import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import {
  EvaRemotePlaybackAria,
  EvaRemotePlaybackAriaTransformed,
  transformEvaRemotePlaybackAria,
} from '../../utils/aria-utilities';

/**
 * The current state of the remote playback connection.
 */
export type EvaRemotePlaybackState = 'disconnected' | 'connecting' | 'connected';

/**
 * Remote playback (Cast/AirPlay) toggle button for the Eva video player.
 *
 * Uses the W3C Remote Playback API (`HTMLVideoElement.remote`) to show the
 * browser's native device picker for ChromeCast (Chrome) and AirPlay (Safari).
 *
 * The button is automatically hidden when:
 * - The Remote Playback API is not supported by the browser.
 * - No remote playback devices are available.
 * - `disableRemotePlayback` is set on the video element.
 *
 * For Safari (which doesn't support the Remote Playback API), the component
 * falls back to `webkitShowPlaybackTargetPicker()`.
 *
 * @example
 * <eva-remote-playback />
 *
 * @example
 * <eva-remote-playback
 *   [evaAria]="{ ariaLabel: 'Cast to TV' }"
 *   (evaRemotePlaybackStateChanged)="onStateChange($event)"
 * />
 */
@Component({
  selector: 'eva-remote-playback',
  templateUrl: './remote-playback.html',
  styleUrl: './remote-playback.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'tabindex': '0',
    'role': 'button',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-valuetext]': 'ariaValueText()',
    '[class.eva-remote-playback-hidden]': '!isAvailable()',
    '[class.eva-remote-playback-connecting]': 'state() === "connecting"',
    '[class.eva-remote-playback-connected]': 'state() === "connected"',
    '(click)': 'onClicked()',
    '(keydown)': 'onKeyDown($event)',
  },
})
export class EvaRemotePlayback implements OnInit, OnDestroy {

  private readonly evaAPI = inject(EvaApi);

  /**
   * When `true`, suppresses the built-in icon so a custom icon can be
   * projected via `<ng-content>`.
   *
   * @default false
   */
  public readonly evaCustomIcon = input<boolean>(false);

  /**
   * ARIA configuration for the remote playback button.
   */
  public readonly evaAria = input<EvaRemotePlaybackAriaTransformed, EvaRemotePlaybackAria>(
    transformEvaRemotePlaybackAria(undefined),
    { transform: transformEvaRemotePlaybackAria },
  );

  /** Emitted when the remote playback state changes. */
  public readonly evaRemotePlaybackStateChanged = output<EvaRemotePlaybackState>();

  /** Static `aria-label` for the button. */
  protected readonly ariaLabel = computed(() => this.evaAria().ariaLabel);

  /** Dynamic `aria-valuetext` based on current connection state. */
  protected readonly ariaValueText = computed(() => {
    const s = this.state();
    const texts = this.evaAria().ariaValueText;
    if (s === 'connected') { return texts.connected; }
    if (s === 'connecting') { return texts.connecting; }
    return texts.disconnected;
  });

  /** Whether remote playback is available (API supported and devices present). */
  protected readonly isAvailable = signal(false);

  /** Current remote playback connection state. */
  protected readonly state = signal<EvaRemotePlaybackState>('disconnected');

  /** Callback ID from `watchAvailability`. Needed for cleanup. */
  private watchId: number | null = null;

  /** Whether Safari's AirPlay fallback is being used. */
  private usingSafariFallback = false;

  /** Subscription to `playerReadyEvent`. Used to defer setup until the player is ready. */
  private playerReadySub: Subscription | null = null;

  /** Event handler for the `connecting` event on `RemotePlayback`. */
  private readonly onConnecting = (): void => {
    this.state.set('connecting');
    this.evaAPI.remotePlaybackStateSubject.next('connecting');
    this.evaRemotePlaybackStateChanged.emit('connecting');
  };

  /** Event handler for the `connect` event on `RemotePlayback`. */
  private readonly onConnect = (): void => {
    this.state.set('connected');
    this.evaAPI.remotePlaybackStateSubject.next('connected');
    this.evaRemotePlaybackStateChanged.emit('connected');
  };

  /** Event handler for the `disconnect` event on `RemotePlayback`. */
  private readonly onDisconnect = (): void => {
    this.state.set('disconnected');
    this.evaAPI.remotePlaybackStateSubject.next('disconnected');
    this.evaRemotePlaybackStateChanged.emit('disconnected');
  };

  /** Waits for the player to be ready, then sets up the Remote Playback API or Safari fallback. */
  public ngOnInit(): void {
    if (this.evaAPI.isPlayerReady) {
      this.setup();
    } else {
      this.playerReadySub = this.evaAPI.playerReadyEvent.subscribe(() => {
        this.setup();
        this.playerReadySub?.unsubscribe();
        this.playerReadySub = null;
      });
    }
  }

  /** Unsubscribes from player ready and tears down Remote Playback API listeners. */
  public ngOnDestroy(): void {
    this.playerReadySub?.unsubscribe();
    this.teardown();
  }

  /** Delegates to `promptDevicePicker()` on host click. */
  protected onClicked(): void {
    this.promptDevicePicker();
  }

  /** Triggers the device picker on `Enter` or `Space` keypress. */
  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.promptDevicePicker();
    }
  }

  /** Detects the available API and initializes remote playback. Registers the prompt callback with `EvaApi`. */
  private setup(): void {
    const video = this.evaAPI.assignedVideoElement;
    if (!video) { return; }

    this.evaAPI.registerRemotePlaybackPrompt(() => { this.promptDevicePicker(); });

    if ('remote' in video && video.remote) {
      this.setupRemotePlaybackAPI(video);
    } else if ('webkitShowPlaybackTargetPicker' in video) {
      this.setupSafariFallback(video);
    }
  }

  /** Initializes the W3C Remote Playback API — watches for device availability and attaches state listeners. */
  private setupRemotePlaybackAPI(video: HTMLVideoElement): void {
    const remote = video.remote;
    if (!remote) { return; }

    remote.watchAvailability((available: boolean) => {
      this.isAvailable.set(available);
    }).then((id: number) => {
      this.watchId = id;
    }).catch(() => {
      this.isAvailable.set(true);
    });

    remote.addEventListener('connecting', this.onConnecting);
    remote.addEventListener('connect', this.onConnect);
    remote.addEventListener('disconnect', this.onDisconnect);
  }

  /** Initializes Safari's AirPlay fallback via webkit-prefixed events. */
  private setupSafariFallback(video: HTMLVideoElement): void {
    this.usingSafariFallback = true;

    video.addEventListener('webkitplaybacktargetavailabilitychanged', (e: Event) => {
      const detail = e as unknown as { availability: string };
      this.isAvailable.set(detail.availability === 'available');
    });

    video.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', () => {
      const isWireless = (video as unknown as { webkitCurrentPlaybackTargetIsWireless: boolean }).webkitCurrentPlaybackTargetIsWireless;
      if (isWireless) {
        this.state.set('connected');
        this.evaAPI.remotePlaybackStateSubject.next('connected');
        this.evaRemotePlaybackStateChanged.emit('connected');
      } else {
        this.state.set('disconnected');
        this.evaAPI.remotePlaybackStateSubject.next('disconnected');
        this.evaRemotePlaybackStateChanged.emit('disconnected');
      }
    });

    this.isAvailable.set(true);
  }

  /** Cancels `watchAvailability` and removes all Remote Playback API event listeners. */
  private teardown(): void {
    const video = this.evaAPI.assignedVideoElement;
    if (!video) { return; }

    if ('remote' in video && video.remote) {
      const remote = video.remote;
      if (this.watchId !== null) {
        remote.cancelWatchAvailability(this.watchId).catch(() => { /* Ignored */ });
        this.watchId = null;
      }
      remote.removeEventListener('connecting', this.onConnecting);
      remote.removeEventListener('connect', this.onConnect);
      remote.removeEventListener('disconnect', this.onDisconnect);
    }
  }

  /** Opens the browser's native device picker via `remote.prompt()` or Safari's `webkitShowPlaybackTargetPicker()`. */
  private promptDevicePicker(): void {
    const video = this.evaAPI.assignedVideoElement;
    if (!video) { return; }

    if (this.usingSafariFallback) {
      (video as unknown as { webkitShowPlaybackTargetPicker: () => void }).webkitShowPlaybackTargetPicker();
      return;
    }

    if ('remote' in video && video.remote) {
      video.remote.prompt().catch(() => { /* User cancelled or not supported */ });
    }
  }
}
