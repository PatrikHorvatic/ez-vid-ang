import { ChangeDetectionStrategy, Component, inject, input, OnDestroy, OnInit, signal, effect } from '@angular/core';
import { transformDefaultPlaybackSpeed, validateAndTransformPlaybackSpeeds } from '../../utils/utilities';
import { EvaApi } from '../../api/eva-api';

@Component({
  selector: 'eva-playback-speed',
  templateUrl: './playback-speed.html',
  styleUrl: './playback-speed.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[class.eva-icon]": "true",
    "[class.open]": "isOpen()",
    "(click)": "playbackClicked()",
    "(keydown)": "playbackClickedKeyboard($event)",
    "(blur)": "handleBlur($event)"
  }
})
export class EvaPlaybackSpeed implements OnInit, OnDestroy {

  private evaAPI = inject(EvaApi);


  /**
   * Playback speeds are validated. Minimal value is 0.25 and maximum value is 4
   * 
   * It is YOUR responsibility to sort the values. 
   * 
   * Transformer function only checks if the values are in acceptable range.
   * Those that are not will be removed from the array.
   * In case of an empty array, component exists and some value must be provided and the default will be 1.0
   */
  readonly playbackSpeeds = input.required<Array<number>, Array<number>>({
    transform: validateAndTransformPlaybackSpeeds
  });

  readonly defaultPlaybackSpeed = input<number, number>(1, {
    transform: transformDefaultPlaybackSpeed
  });

  // Component state
  protected isOpen = signal(false);
  protected currentSpeed = signal(1);
  protected selectedIndex = signal(0);

  private clickOutsideListener?: (event: MouseEvent) => void;

  ngOnInit(): void {
    // Set initial speed
    const speeds = this.playbackSpeeds();
    const defaultSpeed = this.defaultPlaybackSpeed();
    const index = speeds.indexOf(defaultSpeed);

    if (index !== -1) {
      this.currentSpeed.set(defaultSpeed);
      this.selectedIndex.set(index);
    } else if (speeds.length > 0) {
      this.currentSpeed.set(speeds[0]);
      this.selectedIndex.set(0);
    }

    // Listen for clicks outside
    this.clickOutsideListener = this.handleClickOutside.bind(this);
    document.addEventListener('click', this.clickOutsideListener, true);
  }

  ngOnDestroy(): void {
    if (this.clickOutsideListener) {
      document.removeEventListener('click', this.clickOutsideListener, true);
    }
  }

  protected playbackClicked() {
    this.toggleDropdown();
  }

  protected playbackClickedKeyboard(e: KeyboardEvent) {
    const isOpen = this.isOpen();
    const speeds = this.playbackSpeeds();
    const currentIndex = this.selectedIndex();

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.toggleDropdown();
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen && currentIndex > 0) {
          this.selectSpeed(speeds[currentIndex - 1], currentIndex - 1);
        } else if (!isOpen) {
          this.isOpen.set(true);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (isOpen && currentIndex < speeds.length - 1) {
          this.selectSpeed(speeds[currentIndex + 1], currentIndex + 1);
        } else if (!isOpen) {
          this.isOpen.set(true);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.isOpen.set(false);
        break;

      case 'Home':
        if (isOpen) {
          e.preventDefault();
          this.selectSpeed(speeds[0], 0);
        }
        break;

      case 'End':
        if (isOpen) {
          e.preventDefault();
          const lastIndex = speeds.length - 1;
          this.selectSpeed(speeds[lastIndex], lastIndex);
        }
        break;
    }
  }

  protected handleBlur(event: FocusEvent) {
    // Close dropdown when focus moves outside the component
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('eva-playback-speed')) {
      this.isOpen.set(false);
    }
  }

  protected selectSpeed(speed: number, index: number) {
    this.currentSpeed.set(speed);
    this.selectedIndex.set(index);
    this.isOpen.set(false);

    this.evaAPI.setPlaybackSpeed(speed);
  }

  protected formatSpeed(speed: number): string {
    return speed === 1 ? 'Normal' : `${speed}x`;
  }

  private toggleDropdown() {
    this.isOpen.update(open => !open);
  }

  private handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('eva-playback-speed')) {
      this.isOpen.set(false);
    }
  }

  protected trackBySpeed(index: number, speed: number): number {
    return speed;
  }
}