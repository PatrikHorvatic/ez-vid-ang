import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { EvaApi } from '../../api/eva-api';
import { EvaAudioTrack } from '../../types';
import { EvaAudioTrackSelectorAria } from '../../utils/aria-utilities';

const LANGUAGE_CODE_LENGTH = 2;
const LABEL_PREVIEW_LENGTH = 4;

/**
 * Audio track selector component for the Eva video player.
 *
 * Renders a dropdown listing all available audio tracks sourced from
 * `EvaApi.audioTracksSubject`. When the user selects a track, the component
 * calls `EvaApi.setAudioTrack()`, which delegates to whichever streaming directive
 * (HLS or DASH) has registered its audio track setter via `EvaApi.registerAudioTrackFn()`.
 *
 * The component has no direct knowledge of the streaming library — all audio track
 * switching is fully routed through `EvaApi`.
 *
 * **Auto-hide:** the component removes itself from layout (`display: none`) when
 * the stream has zero or one audio track (single-language streams), so it is safe
 * to include it in every player template without a conditional wrapper.
 *
 * The dropdown closes when:
 * - An audio track is selected
 * - Focus moves outside the component (`blur`)
 * - A click is detected outside the component
 * - `Escape` is pressed
 *
 * Keyboard support:
 * - `Enter` / `Space` — open/close the dropdown
 * - `ArrowUp` / `ArrowDown` — navigate and select tracks
 * - `Home` — jump to the first track (only when open)
 * - `End` — jump to the last track (only when open)
 * - `Escape` — close the dropdown
 *
 * @example
 * // Minimal — audio tracks are populated automatically via EvaApi
 * <eva-audio-track-selector />
 *
 * @example
 * // With custom header text
 * <eva-audio-track-selector evaAudioTrackSelectorText="Language" />
 */
@Component({
  selector: 'eva-audio-track-selector',
  imports: [UpperCasePipe],
  templateUrl: './audio-track-selector.html',
  styleUrl: './audio-track-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'tabindex': '0',
    'role': 'button',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-valuetext]': 'currentTrackLabel()',
    '[class.open]': 'isOpen()',
    '[style.display]': 'tracks().length <= 1 ? "none" : null',
    '(click)': 'onClicked()',
    '(keydown)': 'onKeyDown($event)',
    '(blur)': 'onBlur($event)',
  },
})
export class EvaAudioTrackSelector implements OnInit, OnDestroy {
  protected evaAPI = inject(EvaApi);

  /**
   * Label shown in the dropdown header.
   *
   * @default "Audio track"
   */
  public readonly evaAudioTrackSelectorText = input<string>('Audio track');

  /**
   * ARIA label for the audio track selector button.
   */
  public readonly evaAria = input<EvaAudioTrackSelectorAria>({ ariaLabel: 'Audio track selector' });

  /** Resolves the `aria-label` from the aria input. */
  protected readonly ariaLabel = computed<string>(() => this.evaAria().ariaLabel ?? 'Audio track selector');

  /** Whether the dropdown is currently open. */
  protected readonly isOpen = signal(false);

  /** The list of available audio tracks, sourced from `EvaApi.audioTracksSubject`. */
  protected readonly tracks = signal<EvaAudioTrack[]>([]);

  /** Index used for keyboard navigation within the track list. */
  private readonly keyboardIndex = signal(0);

  /** Subscription to audio track changes from `EvaApi`. Cleaned up in `ngOnDestroy`. */
  private audioTracksSub: Subscription | null = null;

  /** Bound reference to the click-outside handler for cleanup in `ngOnDestroy`. */
  private clickOutsideListener?: (event: MouseEvent) => void;

  /**
   * Short label displayed on the button — the current track's language code
   * (uppercased, max 2 chars) when available, otherwise the track's label (max 4 chars).
   */
  protected readonly currentTrackLabel = computed<string>(() => {
    const id = this.evaAPI.currentAudioTrackId();
    const track = this.tracks().find(t => t.id === id);
    if (!track) { return ''; }
    if (track.language) { return track.language.slice(0, LANGUAGE_CODE_LENGTH).toUpperCase(); }
    return track.label.slice(0, LABEL_PREVIEW_LENGTH);
  });

  /**
   * Subscribes to `EvaApi.audioTracksSubject` to keep the dropdown in sync
   * with audio tracks registered by the active streaming directive.
   * Attaches a document-level click listener to close on outside clicks.
   */
  public ngOnInit(): void {
    this.audioTracksSub = this.evaAPI.audioTracksSubject.subscribe(tracks => {
      this.tracks.set(tracks);

      // Sync keyboard cursor to the current track
      const id = this.evaAPI.currentAudioTrackId();
      const idx = tracks.findIndex(t => t.id === id);
      this.keyboardIndex.set(idx >= 0 ? idx : 0);
    });

    this.clickOutsideListener = this.handleClickOutside.bind(this);
    document.addEventListener('click', this.clickOutsideListener, true);
  }

  /** Unsubscribes and removes the document-level click listener. */
  public ngOnDestroy(): void {
    this.audioTracksSub?.unsubscribe();
    if (this.clickOutsideListener) {
      document.removeEventListener('click', this.clickOutsideListener, true);
    }
  }

  /** Toggles the dropdown open/closed on click. */
  protected onClicked(): void {
    this.toggleDropdown();
  }

  /**
   * Selects an audio track, updates `currentAudioTrackId`, and calls `EvaApi.setAudioTrack()`.
   *
   * @param track - The audio track to select.
   * @param index - Its index within `tracks`.
   * @param event - Optional originating mouse event (stopped to prevent dropdown re-toggle).
   */
  protected selectTrack(track: EvaAudioTrack, index: number, event?: MouseEvent): void {
    event?.stopPropagation();
    this.keyboardIndex.set(index);
    this.isOpen.set(false);
    this.evaAPI.controlsSelectorComponentActive.next(false);
    this.evaAPI.setAudioTrack(track.id);
  }

  /**
   * Handles keyboard navigation for the dropdown.
   *
   * - `Enter` / `Space` — toggle the dropdown
   * - `ArrowDown` — open dropdown or select next track
   * - `ArrowUp` — open dropdown or select previous track
   * - `Home` — select the first track (only when open)
   * - `End` — select the last track (only when open)
   * - `Escape` — close the dropdown
   */
  protected onKeyDown(e: KeyboardEvent): void {
    const tracks = this.tracks();
    if (!tracks.length) { return; }
    const isOpen = this.isOpen();
    const currentIndex = this.keyboardIndex();

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.toggleDropdown();
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          this.isOpen.set(true);
          this.evaAPI.controlsSelectorComponentActive.next(true);
        } else {
          const next = Math.min(currentIndex + 1, tracks.length - 1);
          this.selectTrack(tracks[next], next);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          this.isOpen.set(true);
          this.evaAPI.controlsSelectorComponentActive.next(true);
        } else {
          const prev = Math.max(currentIndex - 1, 0);
          this.selectTrack(tracks[prev], prev);
        }
        break;

      case 'Home':
        if (isOpen) {
          e.preventDefault();
          this.selectTrack(tracks[0], 0);
        }
        break;

      case 'End':
        if (isOpen) {
          e.preventDefault();
          const last = tracks.length - 1;
          this.selectTrack(tracks[last], last);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.isOpen.set(false);
        this.evaAPI.controlsSelectorComponentActive.next(false);
        break;

      default:
        break;
    }
  }

  /** Closes the dropdown when focus moves outside the `eva-audio-track-selector` element. */
  protected onBlur(event: FocusEvent): void {
    const related = event.relatedTarget;
    if (!(related instanceof HTMLElement) || !related.closest('eva-audio-track-selector')) {
      this.isOpen.set(false);
      this.evaAPI.controlsSelectorComponentActive.next(false);
    }
  }

  private toggleDropdown(): void {
    this.isOpen.update(open => !open);
    this.evaAPI.controlsSelectorComponentActive.next(this.isOpen());
  }

  private handleClickOutside(event: MouseEvent): void {
    if (!(event.target instanceof HTMLElement)) { return; }
    if (!event.target.closest('eva-audio-track-selector')) {
      this.isOpen.set(false);
      this.evaAPI.controlsSelectorComponentActive.next(false);
    }
  }
}
