import { TestBed, ComponentFixture } from "@angular/core/testing";

import { EvaRemotePlayback } from "./remote-playback";
import { EvaApi } from "../../api/eva-api";

type ListenerCall = [string, EventListenerOrEventListenerObject];

const AIRPLAY_EVENTS = new Set(["webkitplaybacktargetavailabilitychanged", "webkitcurrentplaybacktargetiswirelesschanged"]);
const EXPECTED_AIRPLAY_LISTENER_COUNT = 2;

describe("EvaRemotePlayback", () => {
  let component: EvaRemotePlayback;
  let fixture: ComponentFixture<EvaRemotePlayback>;
  let evaApi: EvaApi;
  let video: HTMLVideoElement;
  let addCalls: ListenerCall[];
  let removeCalls: ListenerCall[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaRemotePlayback],
      providers: [EvaApi],
    }).compileComponents();

    video = document.createElement("video");
    /*
     * Simulate Safari: no W3C Remote Playback API (happy-dom stubs `.remote` unconditionally,
     * so it must be shadowed with an own-property override), but the webkit AirPlay fallback
     * API is present.
     */
    Object.defineProperty(video, "remote", { value: undefined, configurable: true });
    Object.defineProperty(video, "webkitShowPlaybackTargetPicker", { value: (): void => undefined, configurable: true });

    addCalls = [];
    removeCalls = [];
    const originalAdd = video.addEventListener.bind(video);
    const originalRemove = video.removeEventListener.bind(video);
    video.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void => {
      addCalls.push([type, listener]);
      originalAdd(type, listener, options);
    }) as typeof video.addEventListener;
    video.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void => {
      removeCalls.push([type, listener]);
      originalRemove(type, listener, options);
    }) as typeof video.removeEventListener;

    fixture = TestBed.createComponent(EvaRemotePlayback);
    component = fixture.componentInstance;
    evaApi = TestBed.inject(EvaApi);
    evaApi.assignedVideoElement = video;
    evaApi.isPlayerReady = true;

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("removes the Safari AirPlay fallback listeners on destroy using the same handler references that were registered", () => {
    const airplayAddCalls = addCalls.filter(([type]) => AIRPLAY_EVENTS.has(type));
    expect(airplayAddCalls.length).toBe(EXPECTED_AIRPLAY_LISTENER_COUNT);
    expect(removeCalls.filter(([type]) => AIRPLAY_EVENTS.has(type)).length).toBe(0);

    fixture.destroy();

    const airplayRemoveCalls = removeCalls.filter(([type]) => AIRPLAY_EVENTS.has(type));
    expect(airplayRemoveCalls.length).toBe(EXPECTED_AIRPLAY_LISTENER_COUNT);

    for (const [type, handler] of airplayAddCalls) {
      expect(airplayRemoveCalls.some(([removedType, removedHandler]) => removedType === type && removedHandler === handler)).toBe(true);
    }
  });
});
