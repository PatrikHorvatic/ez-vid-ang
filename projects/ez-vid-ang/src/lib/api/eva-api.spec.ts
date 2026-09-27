import { TestBed } from "@angular/core/testing";

import { EvaApi } from "./eva-api";
import { EvaState } from "../types";

const TEST_VOLUME = 0.6;

describe("EvaApi", () => {
  let service: EvaApi;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EvaApi] });
    service = TestBed.inject(EvaApi);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("prepareForSourceChange resets playback state to a fresh/loading baseline", () => {
    const video = document.createElement("video");
    service.assignElementToApi(video);
    service.onPlayerReady();

    // Simulate a video that is mid-playback (playing, buffered, live, seeking) before the switch.
    service.videoStateSubject.next(EvaState.PLAYING);
    service.canPlay.set(true);
    service.isBuffering.set(false);
    service.isSeeking.set(true);
    service.isLive.set(true);
    service.pendingPlayAfterSeek = true;
    service.time.set({ current: 42, remaining: 10, total: 52 });

    service.prepareForSourceChange();

    /*
     * `videoStateSubject` must go back to LOADING synchronously — this is the exact state a
     * stale `PLAYING` value (from before a `evaVideoSources` switch mid-playback) would
     * otherwise incorrectly claim, since HTMLMediaElement.load() never fires a `pause` event.
     */
    expect(service.getCurrentVideoState()).toBe(EvaState.LOADING);
    expect(service.videoStateSubject.value).toBe(EvaState.LOADING);
    expect(service.canPlay()).toBe(false);
    expect(service.isBuffering()).toBe(true);
    expect(service.isSeeking()).toBe(false);
    expect(service.isLive()).toBe(false);
    expect(service.pendingPlayAfterSeek).toBe(false);
    expect(service.time()).toEqual({ current: 0, remaining: 0, total: 0 });
  });

  it("muteOrUnmuteVideo unmutes in a single call when the video started with the native muted attribute set", () => {
    const video = document.createElement("video");
    video.muted = true;
    service.assignElementToApi(video);
    service.onPlayerReady();

    service.muteOrUnmuteVideo();

    expect(video.muted).toBe(false);
    expect(video.volume).toBeGreaterThan(0);
  });

  it("muteOrUnmuteVideo mutes by setting both volume and the native muted attribute", () => {
    const video = document.createElement("video");
    video.volume = TEST_VOLUME;
    service.assignElementToApi(video);
    service.onPlayerReady();

    service.muteOrUnmuteVideo();

    expect(video.muted).toBe(true);
    expect(video.volume).toBe(0);
    expect(service.lastActiveVolume).toBe(TEST_VOLUME);
  });

  it("muteOrUnmuteVideo restores the last active volume on the following unmute call", () => {
    const video = document.createElement("video");
    video.volume = TEST_VOLUME;
    service.assignElementToApi(video);
    service.onPlayerReady();

    service.muteOrUnmuteVideo();
    service.muteOrUnmuteVideo();

    expect(video.muted).toBe(false);
    expect(video.volume).toBe(TEST_VOLUME);
  });

  it("jumpToChapter does not arm pendingPlayAfterSeek when the chapter's startTime already equals currentTime", () => {
    const video = document.createElement("video");
    service.assignElementToApi(video);
    service.onPlayerReady();
    video.currentTime = 30;

    service.jumpToChapter({ startTime: 30, endTime: 60, title: "Chapter 2" });

    expect(service.isSeeking()).toBe(false);
    expect(service.pendingPlayAfterSeek).toBe(false);
  });

  it("updateVideoTime matches a fractional-second chapter boundary instead of briefly reporting no active chapter", () => {
    const video = document.createElement("video");
    Object.defineProperty(video, "duration", { value: 100, configurable: true });
    service.assignElementToApi(video);
    service.onPlayerReady();

    service.isActiveChapterPresent = true;
    service.chapterMarkerChangesSubject.next([
      { startTime: 0, endTime: 20.334, title: "Intro" },
      { startTime: 20.334, endTime: 100, title: "Main" },
    ]);

    video.currentTime = 20.35;
    service.updateVideoTime();

    expect(service.activeChapterSubject.value?.title).toBe("Main");
  });

  it("claimSelector lets a second claimant close out the first, mirroring how two dropdowns should behave", () => {
    const first = Symbol("first");
    const second = Symbol("second");

    service.claimSelector(first);
    expect(service.activeSelectorSubject.value).toBe(first);
    expect(service.controlsSelectorComponentActive.value).toBe(true);

    service.claimSelector(second);
    expect(service.activeSelectorSubject.value).toBe(second);
    expect(service.controlsSelectorComponentActive.value).toBe(true);
  });

  it("releaseSelector no-ops when called by a claimant that already lost the claim to someone else", () => {
    const first = Symbol("first");
    const second = Symbol("second");

    service.claimSelector(first);
    service.claimSelector(second);

    // A stale "close" call from the first (now-superseded) claimant must not clobber the second's claim.
    service.releaseSelector(first);

    expect(service.activeSelectorSubject.value).toBe(second);
    expect(service.controlsSelectorComponentActive.value).toBe(true);
  });

  it("releaseSelector clears the claim and controlsSelectorComponentActive when called by the current claimant", () => {
    const id = Symbol("only");

    service.claimSelector(id);
    service.releaseSelector(id);

    expect(service.activeSelectorSubject.value).toBeNull();
    expect(service.controlsSelectorComponentActive.value).toBe(false);
  });
});
