import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { EvaTrack } from '../../types';
import { EvaApi } from '../../api/eva-api';
import { Subscription } from 'rxjs';

interface TrackInternal {
  id: string;
  label: string;
  selected: boolean;
}

@Component({
  selector: 'eva-track-selector',
  templateUrl: './track-selector.html',
  styleUrl: './track-selector.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class.eva-icon]": "true",
    "[class.open]": "isOpen()",
    "[attr.aria-label]": "evaTrackSelectorText()"
  }
})
export class EvaTrackSelector implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);

  readonly evaTrackSelectorText = input<string>("Track selector");
  readonly evaTrackOffText = input<string>("Off");

  // Generate unique ID for ARIA relationships
  protected readonly uniqueId = `track-selector-${Math.random().toString(36).substr(2, 9)}`;

  protected currentTrack = computed<string | null>(() => {
    if (!this.localTracks) { return null; }
    if (!this.localTracks()) { return null; }

    let t = this.localTracks().filter(a => a.selected === true);
    if (!t[0]) {
      return this.evaTrackOffText();
    }
    return t[0].label;
  });

  protected localTracks!: WritableSignal<TrackInternal[]>;
  protected isOpen = signal(false);

  private clickOutsideListener?: (event: MouseEvent) => void;
  private videoTracksSub: Subscription | null = null;
  private keyboardNavigationIndex = signal(0);

  ngOnInit(): void {
    this.localTracks = signal(
      this.extractTracksFromAssignedVideoElement(
        this.evaAPI.videoTracksSubject.getValue()
      )
    );

    this.videoTracksSub = this.evaAPI.videoTracksSubject.subscribe(t => {
      this.localTracks.set(this.extractTracksFromAssignedVideoElement(t));
    });

    // Listen for clicks outside
    this.clickOutsideListener = this.handleClickOutside.bind(this);
    document.addEventListener('click', this.clickOutsideListener, true);
  }

  ngOnDestroy(): void {
    if (this.videoTracksSub) {
      this.videoTracksSub.unsubscribe();
    }

    if (this.clickOutsideListener) {
      document.removeEventListener('click', this.clickOutsideListener, true);
    }
  }

  protected selectTrack(tr: TrackInternal, i: number) {
    this.localTracks.update(tracks => {
      const updated = tracks.map(track => ({
        ...track,
        selected: false
      }));
      updated[i].selected = true;
      return updated;
    });

    // Update the video element's text tracks
    if (this.evaAPI.assignedVideoElement) {
      Array.from(this.evaAPI.assignedVideoElement.textTracks)
        .forEach(textTrack => {
          if (textTrack.label === tr.label) {
            textTrack.mode = "showing";
          } else {
            textTrack.mode = "hidden";
          }
        });
    }

    // Announce the change to screen readers
    this.announceTrackChange(tr.label);

    this.isOpen.set(false);
  }

  protected trackSelectorClicked() {
    this.toggleDropdown();
  }

  protected playbackClickedKeyboard(e: KeyboardEvent) {
    const tracks = this.localTracks();
    const isDropdownOpen = this.isOpen();

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isDropdownOpen) {
          this.isOpen.set(true);
          // Reset keyboard navigation to current selection
          const currentIndex = tracks.findIndex(t => t.selected);
          this.keyboardNavigationIndex.set(currentIndex >= 0 ? currentIndex : 0);
        }
        break;

      case 'Escape':
        e.preventDefault();
        if (isDropdownOpen) {
          this.isOpen.set(false);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isDropdownOpen) {
          this.isOpen.set(true);
          this.keyboardNavigationIndex.set(0);
        } else {
          // Navigate down in the list
          const nextIndex = Math.min(this.keyboardNavigationIndex() + 1, tracks.length - 1);
          this.keyboardNavigationIndex.set(nextIndex);
          this.selectTrack(tracks[nextIndex], nextIndex);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isDropdownOpen) {
          this.isOpen.set(true);
          this.keyboardNavigationIndex.set(tracks.length - 1);
        } else {
          // Navigate up in the list
          const prevIndex = Math.max(this.keyboardNavigationIndex() - 1, 0);
          this.keyboardNavigationIndex.set(prevIndex);
          this.selectTrack(tracks[prevIndex], prevIndex);
        }
        break;

      case 'Home':
        e.preventDefault();
        if (isDropdownOpen) {
          this.keyboardNavigationIndex.set(0);
          this.selectTrack(tracks[0], 0);
        }
        break;

      case 'End':
        e.preventDefault();
        if (isDropdownOpen) {
          const lastIndex = tracks.length - 1;
          this.keyboardNavigationIndex.set(lastIndex);
          this.selectTrack(tracks[lastIndex], lastIndex);
        }
        break;
    }
  }

  protected handleBlur(event: FocusEvent) {
    // Close dropdown when focus moves outside the component
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('eva-track-selector')) {
      this.isOpen.set(false);
    }
  }

  protected getActiveIndex(): number {
    const tracks = this.localTracks();
    const activeIndex = tracks.findIndex(t => t.selected);
    return activeIndex >= 0 ? activeIndex : 0;
  }

  private handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('eva-track-selector')) {
      this.isOpen.set(false);
    }
  }

  private toggleDropdown() {
    this.isOpen.update(open => !open);

    if (this.isOpen()) {
      // Set keyboard navigation to current selection when opening
      const currentIndex = this.localTracks().findIndex(t => t.selected);
      this.keyboardNavigationIndex.set(currentIndex >= 0 ? currentIndex : 0);
    }
  }

  private extractTracksFromAssignedVideoElement(v: EvaTrack[]): TrackInternal[] {
    if (v.length === 0) {
      return [{
        id: "off",
        label: this.evaTrackOffText(),
        selected: true
      }];
    }

    let a = v.filter(a => a.kind === "subtitles")
      .map(a => ({
        id: a.srclang,
        label: a.label || "",
        selected: a.default === true
      }));

    const hasSelected = a.some(i => i.selected === true);

    return [
      ...a,
      {
        id: "off",
        label: this.evaTrackOffText(),
        selected: !hasSelected
      }
    ];
  }

  /**
   * Announce track changes to screen readers
   */
  private announceTrackChange(trackLabel: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'eva-sr-only';
    announcement.textContent = `${this.evaTrackSelectorText()}: ${trackLabel}`;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}