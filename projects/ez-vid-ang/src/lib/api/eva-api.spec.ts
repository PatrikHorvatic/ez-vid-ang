import { TestBed } from "@angular/core/testing";

import { EvaApi } from "./eva-api";
import { EvaState } from "../types";

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
});
