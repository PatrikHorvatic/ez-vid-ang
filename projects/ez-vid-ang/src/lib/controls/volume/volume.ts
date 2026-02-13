import { ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, OnInit, Renderer2, signal, viewChild, WritableSignal } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';

@Component({
  selector: 'eva-volume',
  templateUrl: './volume.html',
  styleUrl: './volume.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaVolume implements OnInit, OnDestroy {

  private evaAPI = inject(EvaApi);
  private renderer = inject(Renderer2);

  readonly volumeBar = viewChild.required<ElementRef<HTMLDivElement>>('volumeBar');

  // Signals
  protected ariaValue = signal("0");
  protected isDragging = signal(false);
  protected mouseDownPosition: WritableSignal<number> = signal(-1);
  protected videoVolume!: WritableSignal<number>;

  // Subscription and listener cleanup
  private videoVolumeSub: Subscription | null = null;
  private mouseMoveListener?: () => void;
  private mouseUpListener?: () => void;

  ngOnInit(): void {
    // Initialize volume signal
    const initialVolume = this.evaAPI.getVideoVolume();
    this.videoVolume = signal(initialVolume);
    this.ariaValue.set(String(Math.round(initialVolume * 100)));

    // Subscribe to volume changes from API
    this.videoVolumeSub = this.evaAPI.videoVolumeSubject.subscribe(volume => {
      if (volume !== null) {
        this.videoVolume.set(volume);
        this.ariaValue.set(String(Math.round(volume * 100)));
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    this.videoVolumeSub?.unsubscribe();

    // Clean up event listeners if component destroyed while dragging
    this.removeDocumentListeners();
  }

  /**
   * Handle click on volume bar (when not dragging)
   */
  protected onClick(e: MouseEvent) {
    // Prevent click event if this was actually a drag operation
    if (this.mouseDownPosition() !== -1 && this.mouseDownPosition() !== e.clientX) {
      return;
    }

    this.setVolume(this.calculateVolume(e.clientX));
  }

  /**
   * Start dragging - attach document listeners
   */
  protected onMouseDown(e: MouseEvent) {
    e.preventDefault(); // Prevent text selection while dragging

    this.mouseDownPosition.set(e.clientX);
    this.isDragging.set(true);

    // Set initial volume at mousedown position
    this.setVolume(this.calculateVolume(e.clientX));

    // Attach document-level mousemove listener
    this.mouseMoveListener = this.renderer.listen('document', 'mousemove', (event: MouseEvent) => {
      this.onDrag(event);
    });

    // Attach document-level mouseup listener
    this.mouseUpListener = this.renderer.listen('document', 'mouseup', (event: MouseEvent) => {
      this.onStopDrag(event);
    });
  }

  /**
   * Handle dragging - only active when isDragging is true
   */
  private onDrag(event: MouseEvent) {
    if (this.isDragging()) {
      event.preventDefault();
      this.setVolume(this.calculateVolume(event.clientX));
    }
  }

  /**
   * Stop dragging - remove document listeners
   */
  private onStopDrag(event: MouseEvent) {
    if (this.isDragging()) {
      // Set final volume position
      this.setVolume(this.calculateVolume(event.clientX));

      // Reset dragging state
      this.isDragging.set(false);

      // Small timeout to prevent onClick from firing after drag
      setTimeout(() => {
        this.mouseDownPosition.set(-1);
      }, 10);

      // Remove document-level listeners
      this.removeDocumentListeners();
    }
  }

  /**
   * Remove document-level event listeners
   */
  private removeDocumentListeners() {
    this.mouseMoveListener?.();
    this.mouseUpListener?.();
    this.mouseMoveListener = undefined;
    this.mouseUpListener = undefined;
  }

  /**
   * Handle keyboard volume adjustment on the volumeBar element
   * Arrow Up/Right: increase volume
   * Arrow Down/Left: decrease volume
   * Home: max volume, End: mute
   * PageUp/PageDown: large increments
   */
  protected onKeyDown(event: KeyboardEvent) {
    const key = event.key;
    const currentVolume = this.videoVolume() * 100;

    switch (key) {
      case 'ArrowRight':
        event.preventDefault();
        this.setVolume(Math.min(100, currentVolume + 5));
        break;

      case 'ArrowLeft':
        event.preventDefault();
        this.setVolume(Math.max(0, currentVolume - 5));
        break;
    }
  }

  private setVolume(vol: number) {
    const clampedVol = Math.max(0, Math.min(100, vol));
    const normalizedVolume = clampedVol / 100;
    this.evaAPI.setVideoVolume(normalizedVolume);
    this.ariaValue.set(String(Math.round(clampedVol)));
  }

  protected calculateVolume(mousePosX: number): number {
    const recObj = this.volumeBar().nativeElement.getBoundingClientRect();
    const volumeBarOffsetLeft = recObj.left;
    const volumeBarWidth = recObj.width;

    // Calculate percentage based on mouse position
    const percentage = ((mousePosX - volumeBarOffsetLeft) / volumeBarWidth) * 100;

    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, percentage));
  }

  protected onTouchStart(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];

    this.mouseDownPosition.set(touch.clientX);
    this.isDragging.set(true);

    // Set initial volume
    this.setVolume(this.calculateVolume(touch.clientX));

    this.mouseMoveListener = this.renderer.listen('document', 'touchmove', (event: TouchEvent) => {
      event.preventDefault();
      const touchMove = event.touches[0];
      if (this.isDragging()) {
        this.setVolume(this.calculateVolume(touchMove.clientX));
      }
    });

    this.mouseUpListener = this.renderer.listen('document', 'touchend', () => {
      if (this.isDragging()) {
        this.isDragging.set(false);
        setTimeout(() => {
          this.mouseDownPosition.set(-1);
        }, 10);
        this.removeDocumentListeners();
      }
    });
  }
}
