import { ChangeDetectionStrategy, Component, computed, inject, input, signal, AfterViewInit, OnDestroy, OnInit } from "@angular/core";
import { combineLatest, Subscription } from "rxjs";
import { EvaApi } from "../../api/eva-api";
import { EvaTrack, EvaTrackInternal, EvaStreamSubtitleTrack } from "../../types";
import { SCREEN_READER_ANNOUNCEMENT_DURATION_MS } from "../../constants";

/**
 * Subtitle/text track selector component for the Eva video player.
 *
 * Renders a dropdown button that lists all available subtitle tracks, plus an
 * "Off" option to disable subtitles.
 *
 * Track list sources, merged into one dropdown:
 * - `EvaApi.videoTracksSubject`, filtered to `kind === "subtitles"` — tracks declared
 *   via `evaVideoTracks` and rendered as native `<track>` elements.
 * - `EvaApi.streamSubtitleTracksSubject` — manifest-native tracks discovered by
 *   `EvaHlsDirective`/`EvaDashDirective` from an HLS/DASH stream, if active.
 * - If neither source has tracks, only the "Off" option is shown.
 * - The "Off" option is auto-selected whenever no track is selected — manifest-native
 *   tracks are never auto-selected regardless of any `DEFAULT=YES` flag, so a track
 *   only becomes active once the user explicitly picks it.
 *
 * Selecting a declared track hides all native `<track>` elements except the chosen one
 * (via `mode = "showing"`, driven by `EvaCueChangeDirective`) and turns off any active
 * stream-native track via `EvaApi.setStreamSubtitleTrack(-1)`. Selecting a stream-native
 * track does the reverse — it hides all native `<track>` elements and calls
 * `EvaApi.setStreamSubtitleTrack()` with the track's id. The two sources are mutually
 * exclusive; there is a single "Off" state covering both.
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
  selector: "eva-track-selector",
  templateUrl: "./track-selector.html",
  styleUrl: "./track-selector.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class.open]": "isOpen()",
    "[attr.aria-label]": "evaTrackSelectorText()",
  },
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
    const t = this.localTracks().filter((a) => a.selected);
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

  /** Subscription to declared + stream-native track list changes from `EvaApi`. Cleaned up in `ngOnDestroy`. */
  private tracksSub: Subscription | null = null;

  /** Subscription to `EvaApi.videoSubtitlesSubject`, keeping `localTracks` in sync with external changes (e.g. `EvaApi.cycleSubtitleTrack()` from `EvaKeyboardShortcuts`). Cleaned up in `ngOnDestroy`. */
  private subtitlesSub: Subscription | null = null;

  /**
   * Whether the user has explicitly picked a track (or Off) via `selectTrack()`. Consulted by
   * `buildTrackList()` so a real user choice survives a track-list re-registration — the
   * neutral "Off" state present before any interaction is not sticky, so `default: true`
   * tracks can still auto-select normally the first time tracks actually arrive.
   */
  private hasExplicitSelection = false;

  /**
   * Tracks the index of the currently focused option during keyboard navigation.
   * Updated on `ArrowUp`, `ArrowDown`, `Home`, and `End` key events.
   */
  private readonly keyboardNavigationIndex = signal(0);
  private announceTimeout?: number;

  /**
   * Subscribes to `EvaApi.videoTracksSubject` and `EvaApi.streamSubtitleTracksSubject`
   * (both `BehaviorSubject`s, so this also synchronously initializes `localTracks` with
   * their current values), and attaches a document-level click listener to close the
   * dropdown when clicking outside.
   */
  public ngOnInit(): void {
    this.tracksSub = combineLatest([this.evaAPI.videoTracksSubject, this.evaAPI.streamSubtitleTracksSubject]).subscribe(([declared, stream]) => {
      this.localTracks.set(this.buildTrackList(declared, stream));
      this.changeSubtitles();
    });

    this.subtitlesSub = this.evaAPI.videoSubtitlesSubject.subscribe((active) => {
      this.reconcileSelection(active);
    });

    // Listen for clicks outside
    this.clickOutsideListener = this.handleClickOutside.bind(this);
    document.addEventListener("click", this.clickOutsideListener, true);
  }

  // We need to set first value to the player component.
  public ngAfterViewInit(): void {
    this.changeSubtitles();
  }

  /** Unsubscribes from track changes and removes the document-level click listener. */
  public ngOnDestroy(): void {
    if (this.tracksSub) {
      this.tracksSub.unsubscribe();
    }
    this.subtitlesSub?.unsubscribe();
    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
    }
    if (this.clickOutsideListener) {
      document.removeEventListener("click", this.clickOutsideListener, true);
    }
  }

  /**
   * Selects a track, updates `localTracks` so only the chosen track is marked as selected,
   * hides all native `<track>` elements (declared tracks are re-shown via `mode = "showing"`
   * by `EvaCueChangeDirective`, driven by `EvaApi.videoSubtitlesSubject`), routes stream-native
   * selections through `EvaApi.setStreamSubtitleTrack()`, announces the change to screen
   * readers, and closes the dropdown.
   *
   * @param tr - The track to select.
   * @param i - The index of the track within `localTracks`.
   */
  protected selectTrack(tr: EvaTrackInternal, i: number): void {
    this.hasExplicitSelection = true;
    this.localTracks.update((tracks) => {
      const updated = tracks.map((track) => ({
        ...track,
        selected: false,
      }));
      updated[i].selected = true;
      return updated;
    });

    // Update the video element's text tracks
    if (this.evaAPI.assignedVideoElement) {
      Array.from(this.evaAPI.assignedVideoElement.textTracks).forEach((textTrack) => {
        textTrack.mode = "hidden";
      });
    }

    // Mutual exclusivity: selecting a stream-native track switches to it directly.
    // Selecting anything else (a declared track, or "Off") turns any active stream track off.
    if (tr.source === "stream" && tr.streamId !== undefined) {
      this.evaAPI.setStreamSubtitleTrack(tr.streamId);
    } else {
      this.evaAPI.setStreamSubtitleTrack(-1);
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
      case "Enter":
      case " ":
        e.preventDefault();
        if (!isDropdownOpen) {
          this.isOpen.set(true);
          this.evaAPI.controlsSelectorComponentActive.next(true);
          // Reset keyboard navigation to current selection
          const currentIndex = tracks.findIndex((t) => t.selected);
          this.keyboardNavigationIndex.set(currentIndex >= 0 ? currentIndex : 0);
        }
        break;

      case "Escape":
        e.preventDefault();
        if (isDropdownOpen) {
          this.isOpen.set(false);
          this.evaAPI.controlsSelectorComponentActive.next(false);
        }
        break;

      case "ArrowDown":
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

      case "ArrowUp":
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

      case "Home":
        e.preventDefault();
        if (isDropdownOpen) {
          this.keyboardNavigationIndex.set(0);
          this.selectTrack(tracks[0], 0);
        }
        break;

      case "End":
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
    if (!(relatedTarget instanceof HTMLElement) || !relatedTarget.closest("eva-track-selector")) {
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
    const activeIndex = tracks.findIndex((t) => t.selected);
    return activeIndex >= 0 ? activeIndex : 0;
  }

  /**
   * Document-level click handler that closes the dropdown when a click
   * is detected outside the `eva-track-selector` element.
   *
   * @param event - The native `MouseEvent` from the document listener.
   */
  private handleClickOutside(event: MouseEvent): void {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }
    if (!event.target.closest("eva-track-selector")) {
      this.isOpen.set(false);
      this.evaAPI.controlsSelectorComponentActive.next(false);
    }
  }

  /**
   * Toggles the `isOpen` signal between `true` and `false`.
   * When opening, resets `keyboardNavigationIndex` to the currently selected track.
   */
  private toggleDropdown(): void {
    this.isOpen.update((open) => !open);
    this.evaAPI.controlsSelectorComponentActive.next(this.isOpen());
    if (this.isOpen()) {
      // Set keyboard navigation to current selection when opening
      const currentIndex = this.localTracks().findIndex((t) => t.selected);
      this.keyboardNavigationIndex.set(currentIndex >= 0 ? currentIndex : 0);
    }
  }

  /**
   * Merges `evaVideoTracks`-declared tracks and manifest-native HLS/DASH tracks into
   * the internal `EvaTrackInternal` format used by the dropdown, plus a trailing "Off" option.
   *
   * - Declared tracks are filtered to `kind === "subtitles"` and selected when `default === true`.
   * - Stream tracks are never auto-selected, regardless of any manifest `DEFAULT=YES` flag —
   *   see the class-level doc comment.
   * - The "Off" option is selected whenever neither source has a selected track (including
   *   when both are empty).
   *
   * Preserves the user's explicitly selected track (by `id`, including an explicit "Off",
   * tracked via `hasExplicitSelection`) across the rebuild if it is still present in the
   * new combined list — both source subjects can legitimately re-emit mid-session (e.g.
   * `evaVideoTracks` changing on a playlist swap, or hls.js re-firing
   * `SUBTITLE_TRACKS_UPDATED` on a manifest reload) and without this, a user's explicit
   * choice would be silently reverted back to whatever the `default` flags compute on
   * every such re-emission. Only an explicit selection is sticky this way — the neutral
   * "Off" state present before the user ever interacts is not, so a `default: true` track
   * can still auto-select the first time tracks actually arrive (e.g. tracks loading
   * asynchronously after the player first renders with an empty list).
   *
   * @param declaredTracks - The raw track list from `EvaApi.videoTracksSubject`.
   * @param streamTracks - The raw track list from `EvaApi.streamSubtitleTracksSubject`.
   */
  private buildTrackList(declaredTracks: EvaTrack[] | null, streamTracks: EvaStreamSubtitleTrack[]): EvaTrackInternal[] {
    const previousSelectedId = this.hasExplicitSelection ? this.localTracks().find((t) => t.selected)?.id : undefined;

    const declared: EvaTrackInternal[] = (declaredTracks ?? [])
      .filter((t) => t.kind === "subtitles")
      .map((b) => ({
        id: b.srclang,
        label: b.label || "",
        selected: b.default === true,
        source: "declared" as const,
      }));

    const stream: EvaTrackInternal[] = streamTracks.map((t) => ({
      id: `stream:${t.id}`,
      label: t.label,
      selected: false,
      source: "stream" as const,
      streamId: t.id,
    }));

    const combined = [...declared, ...stream];

    if (previousSelectedId !== undefined) {
      if (previousSelectedId === "off") {
        for (const t of combined) {
          t.selected = false;
        }
      } else if (combined.some((t) => t.id === previousSelectedId)) {
        for (const t of combined) {
          t.selected = t.id === previousSelectedId;
        }
      }
    }

    const hasSelected = combined.some((i) => i.selected);

    return [
      ...combined,
      {
        id: "off",
        label: this.evaTrackOffText(),
        selected: !hasSelected,
        source: "declared" as const,
      },
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
    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout);
    }
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "eva-sr-only";
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
    const t = this.localTracks().find((a) => a.selected);
    this.evaAPI.subtitlesChanged(t ? t : null);
  }

  /**
   * Reconciles `localTracks`' `selected` flags with an externally-set active track
   * (e.g. `EvaApi.cycleSubtitleTrack()` called from `EvaKeyboardShortcuts`), so the
   * dropdown's highlighted option and `currentTrack()` label stay accurate even when
   * the selection changes outside of this component's own click/keyboard handlers.
   */
  private reconcileSelection(active: EvaTrackInternal | null): void {
    if (!active) {
      return;
    }
    this.localTracks.update((tracks) => {
      if (!tracks.some((t) => t.id === active.id)) {
        return tracks;
      }
      return tracks.map((t) => ({ ...t, selected: t.id === active.id }));
    });
  }
}
