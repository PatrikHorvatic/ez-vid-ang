import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';
import { EvaFullscreenAria, EvaFullscreenAriaTransformed, transformEvaFullscreenAria } from '../../utils/aria-utilities';

@Component({
  selector: 'eva-fullscreen',
  templateUrl: './fullscreen.html',
  styleUrl: './fullscreen.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[attr.aria-label]": "ariaLabel()",
    "[class.eva-icon]": "true",
    "[class.eva-icon-fullscreen]": "true",
    "[class.eva-icon-fullscreen_exit]": "false",
    "(click)": "fullscreenClicked()",
    "(keydown)": "fullscreenClickedKeyboard($event)"
  }
})
export class EvaFullscreen implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);
  private fullscreenService = inject(EvaFullscreenAPI);

  readonly evaAria = input<EvaFullscreenAria, EvaFullscreenAriaTransformed>({}, { transform: transformEvaFullscreenAria });

  protected isFullscreen: WritableSignal<boolean> = signal(false);

  protected ariaLabel = computed(() => {
    return this.isFullscreen() ? this.evaAria().exitFullscreen : this.evaAria().enterFullscreen;
  });

  private fullscreenSubscription: Subscription | null = null;


  ngOnInit(): void {
    this.fullscreenSubscription = this.fullscreenService.isFullscreenObs.subscribe(
      isFullscreen => {
        this.isFullscreen.set(isFullscreen);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.fullscreenSubscription) {
      this.fullscreenSubscription.unsubscribe();
    }
  }

  protected async fullscreenClicked() {
    try {
      // Get the player container element
      const playerContainer = this.findPlayerContainer();

      if (!playerContainer) {
        console.warn('Player container not found');
        return;
      }

      // Get the video element if available
      const videoElement = this.evaAPI.assignedVideoElement;

      // Toggle fullscreen
      await this.fullscreenService.toggleFullscreen(playerContainer, videoElement);
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  }

  protected fullscreenClickedKeyboard(k: KeyboardEvent) {
    // On press Enter (13) or Space (32)
    if (k.keyCode === 13 || k.keyCode === 32) {
      k.preventDefault();
      this.fullscreenClicked();
    }
  }

  private findPlayerContainer(): HTMLElement | null {
    // Try to find eva-player as parent
    const playerElement = document.querySelector('eva-player') as HTMLElement;

    if (playerElement) {
      return playerElement;
    }

    // Fallback: try to find from current element
    const currentElement = document.querySelector('eva-fullscreen');
    if (currentElement) {
      const closestPlayer = currentElement.closest('eva-player') as HTMLElement;
      if (closestPlayer) {
        return closestPlayer;
      }
    }

    return null;
  }

}
