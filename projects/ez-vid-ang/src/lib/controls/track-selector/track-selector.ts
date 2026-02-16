import { ChangeDetectionStrategy, Component, computed, inject, input, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { EvaTrack } from '../../types';
import { EvaApi } from '../../api/eva-api';
import { Subscription } from 'rxjs';

interface TrackInternal {
  id: string;
  label: string,
  selected: boolean
}

@Component({
  selector: 'eva-track-selector',
  templateUrl: './track-selector.html',
  styleUrl: './track-selector.scss',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "tabindex": "0",
    "role": "button",
    "[class.eva-icon]": "true",
    "[class.open]": "isOpen()",
    "(click)": "trackSelectorClicked()",
    "(keydown)": "playbackClickedKeyboard($event)",
    "(blur)": "handleBlur($event)"
  }
})
export class EvaTrackSelector implements OnInit, OnDestroy {
  private evaAPI = inject(EvaApi);

  readonly evaTrackSelectorText = input<string>("Track selector");
  readonly evaTrackOffText = input<string>("Off");

  protected currentTrack = computed<string | null>(() => {
    if (!this.localTracks) { return null; }
    if (!this.localTracks()) { return null; }

    let t = this.localTracks().filter(a => a.selected === true);
    if (!t[0]) {
      return "";
    }
    return t[0].label;
  });

  protected localTracks!: WritableSignal<TrackInternal[]>;

  protected isOpen = signal(false);


  private clickOutsideListener?: (event: MouseEvent) => void;
  private videoTracksSub: Subscription | null = null;

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
    this.isOpen.set(false);
  }

  protected trackSelectorClicked() {
    this.toggleDropdown();
  }

  protected playbackClickedKeyboard(e: KeyboardEvent) {

  }

  protected handleBlur(event: FocusEvent) {
    // Close dropdown when focus moves outside the component
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('eva-track-selector')) { // Changed from 'eva-playback-speed'
      this.isOpen.set(false);
    }
  }

  private handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('eva-track-selector')) { // Changed from 'eva-playback-speed'
      this.isOpen.set(false);
    }
  }


  private toggleDropdown() {
    this.isOpen.update(open => !open);
  }

  private extractTracksFromAssignedVideoElement(v: EvaTrack[]): TrackInternal[] {
    if (v.length === 0) {
      return [];
    }

    let a = v.filter(a => a.kind === "subtitles")
      .map(a => ({
        id: a.srclang,
        label: a.label || "",
        selected: a.default === true
      }));

    return [
      ...a,
      {
        id: "",
        label: this.evaTrackOffText(),
        selected: a.every(i => i.selected === false)
      }
    ];
  }
}
