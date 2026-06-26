import { ChangeDetectionStrategy, Component, computed, inject, input, signal, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaTrack, EvaTrackInternal } from '../../types';
import { SCREEN_READER_ANNOUNCEMENT_DURATION_MS } from '../../constants';



/**
 * Subtitle/text track selector component for the Eva video player.
 *
 * Renders a dropdown button that lists all available subtitle tracks extracted from
 * the video element's text tracks, plus an "Off" option to disable subtitles.
 * Selecting a track sets its `mode` to `"showing"` on the native `HTMLVideoElement`
 * and hides all others.
 *
 * Track list sources:
 * - Populated from `EvaApi.videoTracksSubject`, filtered to `kind === "subtitles"`.
 * - If no tracks are available, only the "Off" option is shown.
 * - The "Off" option is auto-selected when no track has `default === true`.
 *
 * The dropdown closes when:
 * - A track is selected
 * - Focus moves outside the component (`blur`)
 * - A click is detected outside the component
 * - `Escape` is pressed
 *
 * Screen reader support:
 * - Track changes are announced via a dynamically injected `role="status"` live region
 *   that is removed from the DOM after 1 second.
 * - A unique `id` is generated per instance for ARIA relationships.
 *
 * Keyboard support:
 * - `Enter` / `Space` — open the dropdown
 * - `ArrowDown` — open dropdown or select the next track
 * - `ArrowUp` — open dropdown or select the previous track
 * - `Home` — select the first track
 * - `End` — select the last track
 * - `Escape` — close the dropdown
 *
 * @example
 * // Minimal usage
 * <eva-track-selector />
 *
 * @example
 * // Custom labels
 * <eva-track-selector
 *   evaTrackSelectorText="Subtitles"
 *   evaTrackOffText="Disabled"
 * />
 */
@Component({
  selector: 'eva-track-selector',
  templateUrl: './track-selector.html',
  styleUrl: './track-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class.eva-icon]": "true",
    "[class.open]": "isOpen()",
    "[attr.aria-label]": "evaTrackSelectorText()"
  }
})
export class EvaTrackSelector implements OnInit, AfterViewInit, OnDestroy {
  private readonly evaAPI = inject(EvaApi);

  /**
   * The `aria-label` applied to the host element and used as the prefix
   * in screen reader announcements when a track is selected.
   *
   * @default "Track selector"
   */
  public readonly evaTrackSelectorText = input<string>("Track selector");

  /**
   * The label used for the "Off" option that disables all subtitle tracks.
   *
   * @default "Off"
   */
  public readonly evaTrackOffText = input<string>("Off");

  /**
   * A unique ID generated per component instance for use in ARIA relationships
   * (e.g. `aria-controls`, `aria-labelledby`) in the template.
   */
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  protected readonly uniqueId = `track-selector-${Math.random().toString(36).slice(2, 11)}`;

  /**
   * The label of the currently selected track, or `evaTrackOffText` if no track is selected.
   * Returns `null` if `localTracks` is not yet initialized.
   */
  protected readonly currentTrack = computed<string | null>(() => {
    const t = this.localTracks().filter(a => a.selected);
    if (!t[0]) {
      return this.evaTrackOffText();
    }
    return t[0].label;
  });

  /** The local list of track options rendered in the dropdown, including the "Off" option. */
  protected readonly localTracks = signal<EvaTrackInternal[]>([]);

  /** Whether the track dropdown is currently open. Applies the `open` class to the host. */
  protected readonly isOpen = signal(false);

  /** Bound reference to the click-outside handler, stored for removal in `ngOnDestroy`. */
  private clickOutsideListener?: (event: MouseEvent) => void;

  /** Subscription to track list changes from `EvaApi`. Cleaned up in `ngOnDestroy`. */
  private videoTracksSub: Subscription | null = null;

  /**
   * Tracks the index of the currently focused option during keyboard navigation.
   * Updated on `ArrowUp`, `ArrowDown`, `Home`, and `End` key events.
   */
  private readonly keyboardNavigationIndex = signal(0);
  private announceTimeout?: number;

  /**
   * Initializes `localTracks` from the current value of `EvaApi.videoTracksSubject`,
   * subscribes to future track changes, and attaches a document-level click listener
   * to close the dropdown when clicking outside.
   */
  public ngOnInit(): void {
    this.localTracks.set(
      this.extractTracksFromAssignedVideoElement(
        this.evaAPI.videoTracksSubject.getValue()
      )
    );

    this.videoTracksSub = this.evaAPI.videoTracksSubject.subscribe(t => {
      this.localTracks.set(this.extractTracksFromAssignedVideoElement(t));
      this.changeSubtitles();
    });

    // Listen for clicks outside
    this.clickOutsideListener = this.handleClickOutside.bind(this);
    document.addEventListener('click', this.clickOutsideListener, true);
  }

  // We need to set first value to the player component.
  public ngAfterViewInit(): void {
    this.changeSubtitles();
  }

  /** Unsubscribes from track changes and removes the document-level click listener. */
  public ngOnDestroy(): void {
    if (this.videoTracksSub) {
      this.videoTracksSub.unsubscribe();
    }
    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
    }
    if (this.clickOutsideListener) {
      document.removeEventListener('click', this.clickOutsideListener, true);
    }
  }

  /**
   * Selects a track, updates `localTracks` so only the chosen track is marked as selected,
   * sets the corresponding `HTMLTextTrack.mode` to `"showing"` (and all others to `"hidden"`),
   * announces the change to screen readers, and closes the dropdown.
   *
   * @param tr - The track to select.
   * @param i - The index of the track within `localTracks`.
   */
  protected selectTrack(tr: EvaTrackInternal, i: number): void {
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
        .forEach(textTrack => { textTrack.mode = "hidden"; });
    }

    this.evaAPI.subtitlesChanged(tr);
    // Announce the change to screen readers
    this.announceTrackChange(tr.label);

    this.isOpen.set(false);
    this.evaAPI.controlsSelectorComponentActive.next(false);
  }

  /** Toggles the dropdown open/closed on click. */
  protected trackSelectorClicked(): void {
    this.toggleDropdown();
  }

  /**
   * Handles keyboard navigation for the dropdown.
   *
   * - `Enter` / `Space` — open the dropdown and restore focus to the current selection
   * - `Escape` — close the dropdown
   * - `ArrowDown` — open the dropdown or select the next track
   * - `ArrowUp` — open the dropdown or select the previous track
   * - `Home` — select the first track (only when open)
   * - `End` — select the last track (only when open)
   */
  protected playbackClickedKeyboard(e: KeyboardEvent): void {
    const tracks = this.localTracks();
    const isDropdownOpen = this.isOpen();

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isDropdownOpen) {
          this.isOpen.set(true);
          this.evaAPI.controlsSelectorComponentActive.next(true);
          // Reset keyboard navigation to current selection
          const currentIndex = tracks.findIndex(t => t.selected);
          this.keyboardNavigationIndex.set(currentIndex >= 0 ? currentIndex : 0);
        }
        break;

      case 'Escape':
        e.preventDefault();
        if (isDropdownOpen) {
          this.isOpen.set(false);
          this.evaAPI.controlsSelectorComponentActive.next(false);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isDropdownOpen) {
          this.isOpen.set(true);
          this.evaAPI.controlsSelectorComponentActive.next(true);
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
          this.evaAPI.controlsSelectorComponentActive.next(true);
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
      default:
        break;
    }
  }

  /**
   * Closes the dropdown when focus moves outside the `eva-track-selector` element.
   * Uses `relatedTarget` to detect where focus is moving to.
   */
  protected handleBlur(event: FocusEvent): void {
    // Close dropdown when focus moves outside the component
    const relatedTarget = event.relatedTarget;
    if (!(relatedTarget instanceof HTMLElement) || !relatedTarget.closest('eva-track-selector')) {
      this.isOpen.set(false);
      this.evaAPI.controlsSelectorComponentActive.next(false);
    }
  }

  /**
   * Returns the index of the currently selected track within `localTracks`.
   * Falls back to `0` if no track is marked as selected.
   */
  protected getActiveIndex(): number {
    const tracks = this.localTracks();
    const activeIndex = tracks.findIndex(t => t.selected);
    return activeIndex >= 0 ? activeIndex : 0;
  }

  /**
   * Document-level click handler that closes the dropdown when a click
   * is detected outside the `eva-track-selector` element.
   *
   * @param event - The native `MouseEvent` from the document listener.
   */
  private handleClickOutside(event: MouseEvent): void {
    if (!(event.target instanceof HTMLElement)) { return; }
    if (!event.target.closest('eva-track-selector')) {
      this.isOpen.set(false);
      this.evaAPI.controlsSelectorComponentActive.next(false);
    }
  }

  /**
   * Toggles the `isOpen` signal between `true` and `false`.
   * When opening, resets `keyboardNavigationIndex` to the currently selected track.
   */
  private toggleDropdown(): void {
    this.isOpen.update(open => !open);
    this.evaAPI.controlsSelectorComponentActive.next(this.isOpen());
    if (this.isOpen()) {
      // Set keyboard navigation to current selection when opening
      const currentIndex = this.localTracks().findIndex(t => t.selected);
      this.keyboardNavigationIndex.set(currentIndex >= 0 ? currentIndex : 0);
    }
  }

  /**
   * Converts an array of `EvaTrack` objects into the internal `EvaTrackInternal` format
   * used by the dropdown, filtered to `kind === "subtitles"`.
   *
   * - If no tracks are provided, returns a single "Off" option marked as selected.
   * - Appends an "Off" option at the end, selected when no track has `default === true`.
   *
   * @param v - The raw track list from `EvaApi.videoTracksSubject`.
   */
  private extractTracksFromAssignedVideoElement(v: EvaTrack[] | null): EvaTrackInternal[] {
    if (!v || v.length === 0) {
      return [{
        id: "off",
        label: this.evaTrackOffText(),
        selected: true
      }];
    }

    const a = v.filter(t => t.kind === "subtitles")
      .map(b => ({
        id: b.srclang,
        label: b.label || "",
        selected: b.default === true
      }));

    const hasSelected = a.some(i => i.selected);

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
   * Announces a track selection change to screen readers by injecting a temporary
   * `role="status"` live region into the document body.
   *
   * The announcement reads as `"{evaTrackSelectorText}: {trackLabel}"` and the element
   * is removed from the DOM after 1 second.
   *
   * @param trackLabel - The label of the newly selected track.
   */
  private announceTrackChange(trackLabel: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'eva-sr-only';
    announcement.textContent = `${this.evaTrackSelectorText()}: ${trackLabel}`;

    document.body.appendChild(announcement);

    this.announceTimeout = window.setTimeout(() => {
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    }, SCREEN_READER_ANNOUNCEMENT_DURATION_MS);
  }

  private changeSubtitles(): void {
    if (!this.currentTrack()) {
      this.evaAPI.subtitlesChanged(null);
      return;
    }
    const t = this.localTracks().find(a => a.selected);
    this.evaAPI.subtitlesChanged(t ? t : null);
  }
}