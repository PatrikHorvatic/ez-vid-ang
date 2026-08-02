import { TestBed, ComponentFixture } from "@angular/core/testing";

import { EvaTrackSelector } from "./track-selector";
import { EvaApi } from "../../api/eva-api";
import { EvaFullscreenAPI } from "../../api/fullscreen";
import { EvaTrack, EvaTrackInternal } from "../../types";

describe("TrackSelector", () => {
  let component: EvaTrackSelector;
  let fixture: ComponentFixture<EvaTrackSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaTrackSelector],
      providers: [EvaApi, EvaFullscreenAPI],
    }).compileComponents();

    fixture = TestBed.createComponent(EvaTrackSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("preserves an explicitly selected track across a re-registration of the same tracks (e.g. a playlist swap)", async () => {
    const evaApi = fixture.debugElement.injector.get(EvaApi);
    const tracks: EvaTrack[] = [
      { kind: "subtitles", srclang: "en", label: "English", src: "en.vtt" },
      { kind: "subtitles", srclang: "fr", label: "French", src: "fr.vtt", default: true },
    ];

    evaApi.videoTracksSubject.next(tracks);
    fixture.detectChanges();
    await fixture.whenStable();

    // The declared French track is selected by default.
    expect(evaApi.videoSubtitlesSubject.value?.id).toBe("fr");

    // The user explicitly switches to English.
    const localTracks = (component as unknown as { localTracks: () => EvaTrackInternal[] }).localTracks;
    const selectTrack = (component as unknown as { selectTrack: (tr: EvaTrackInternal, i: number) => void }).selectTrack.bind(component);
    const enIndex = localTracks().findIndex((t) => t.id === "en");
    selectTrack(localTracks()[enIndex], enIndex);

    expect(evaApi.videoSubtitlesSubject.value?.id).toBe("en");

    /*
     * The same track list is re-registered (e.g. a playlist swap re-declaring the same
     * tracks, or an HLS manifest reload re-emitting SUBTITLE_TRACKS_UPDATED). The user's
     * explicit choice must survive this, not silently revert to the `default` flag.
     */
    evaApi.videoTracksSubject.next([...tracks]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(evaApi.videoSubtitlesSubject.value?.id).toBe("en");
  });

  it("preserves an explicit Off selection across a re-registration of the same tracks", async () => {
    const evaApi = fixture.debugElement.injector.get(EvaApi);
    const tracks: EvaTrack[] = [{ kind: "subtitles", srclang: "en", label: "English", src: "en.vtt", default: true }];

    evaApi.videoTracksSubject.next(tracks);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(evaApi.videoSubtitlesSubject.value?.id).toBe("en");

    const localTracks = (component as unknown as { localTracks: () => EvaTrackInternal[] }).localTracks;
    const selectTrack = (component as unknown as { selectTrack: (tr: EvaTrackInternal, i: number) => void }).selectTrack.bind(component);
    const offIndex = localTracks().findIndex((t) => t.id === "off");
    selectTrack(localTracks()[offIndex], offIndex);

    expect(evaApi.videoSubtitlesSubject.value?.id).toBe("off");

    evaApi.videoTracksSubject.next([...tracks]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(evaApi.videoSubtitlesSubject.value?.id).toBe("off");
  });
});
