/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import { By } from "@angular/platform-browser";
import { EvaPlayer } from "../core/player/player";
import { EvaApi } from "../api/eva-api";
import { EvaHlsDirective } from "./hls";

const HLS_EVENTS = {
  MANIFEST_PARSED: "hlsManifestParsed",
  LEVEL_SWITCHED: "hlsLevelSwitched",
  LEVEL_LOADED: "hlsLevelLoaded",
  AUDIO_TRACKS_UPDATED: "hlsAudioTracksUpdated",
  AUDIO_TRACK_SWITCHED: "hlsAudioTrackSwitched",
  SUBTITLE_TRACKS_UPDATED: "hlsSubtitleTracksUpdated",
};

/** Minimal fake of an hls.js instance, exposing just enough to drive `EvaHlsDirective`. */
function createFakeHls(): {
  destroyed: boolean;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
  attachMedia: () => void;
  loadSource: () => void;
  destroy: () => void;
} {
  const listeners = new Map<string, ((...args: unknown[]) => void)[]>();
  const fake = {
    destroyed: false,
    on(event: string, cb: (...args: unknown[]) => void): void {
      const arr = listeners.get(event) ?? [];
      arr.push(cb);
      listeners.set(event, arr);
    },
    emit(event: string, ...args: unknown[]): void {
      (listeners.get(event) ?? []).forEach((cb) => {
        cb(...args);
      });
    },
    attachMedia(): void {},
    loadSource(): void {},
    destroy(): void {
      fake.destroyed = true;
    },
  };
  return fake;
}
type FakeHls = ReturnType<typeof createFakeHls>;

function FakeHlsConstructor(): FakeHls {
  return createFakeHls();
}
FakeHlsConstructor.isSupported = (): boolean => true;
FakeHlsConstructor.Events = HLS_EVENTS;

@Component({
  selector: "eva-test-host",
  imports: [EvaPlayer, EvaHlsDirective],
  template: `
    <eva-player evaHls id="test" [evaHlsSrc]="hlsSrc()" [evaVideoSources]="sources()" />
  `,
})
class TestHostComponent {
  protected readonly sources = signal([{ src: "", type: "video/mp4" }]);
  public readonly hlsSrc = signal("https://example.com/stream.m3u8");
}

describe("HlsDirective", () => {
  let originalHls: unknown;

  beforeEach(async () => {
    originalHls = (globalThis as Record<string, unknown>)["Hls"];
    (globalThis as Record<string, unknown>)["Hls"] = FakeHlsConstructor;

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>)["Hls"] = originalHls;
  });

  it("should create an instance", () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("clears the registered quality levels when the stream is torn down on a source change", async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const hlsDirective = fixture.debugElement.query(By.directive(EvaHlsDirective)).injector.get(EvaHlsDirective);
    const hls = hlsDirective.getHlsInstance() as FakeHls;
    hls.emit(HLS_EVENTS.MANIFEST_PARSED, {}, { levels: [{ height: 720, width: 1280, bitrate: 1_000_000 }] });

    const evaApi = fixture.debugElement.query(By.directive(EvaPlayer)).injector.get(EvaApi);
    expect(evaApi.qualityLevelsSubject.value.length).toBeGreaterThan(0);

    fixture.componentInstance.hlsSrc.set("https://example.com/stream2.m3u8");
    fixture.detectChanges();

    expect(evaApi.qualityLevelsSubject.value).toEqual([]);
  });
});
