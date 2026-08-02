/* eslint-disable @typescript-eslint/no-empty-function */
import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import { By } from "@angular/platform-browser";
import { EvaPlayer } from "../core/player/player";
import { EvaApi } from "../api/eva-api";
import { EvaDashDirective } from "./dash";

type DashRepresentationLike = { index: number; bandwidth: number; width: number; height: number; frameRate: number; codecs: string | null };

/** Simulates dash.js's real settings tree, which deep-merges across successive `updateSettings()` calls. */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const sVal = source[key];
    const tVal = result[key];
    if (sVal && typeof sVal === "object" && !Array.isArray(sVal) && tVal && typeof tVal === "object" && !Array.isArray(tVal)) {
      result[key] = deepMerge(tVal as Record<string, unknown>, sVal as Record<string, unknown>);
    } else {
      result[key] = sVal;
    }
  }
  return result;
}

/** Minimal fake of a dash.js player instance, exposing just enough to drive `EvaDashDirective`. */
function createFakeDashPlayer(): {
  settings: Record<string, unknown>;
  destroyed: boolean;
  updateSettings: (settings: Record<string, unknown>) => void;
  on: (event: string, cb: () => void) => void;
  emit: (event: string) => void;
  initialize: () => void;
  setAutoPlay: () => void;
  attachSource: () => void;
  setProtectionData: () => void;
  getRepresentationsByType: () => DashRepresentationLike[];
  getTracksFor: () => unknown[];
  setRepresentationForTypeByIndex: () => void;
  reset: () => void;
} {
  const listeners = new Map<string, (() => void)[]>();
  const fake = {
    settings: {} as Record<string, unknown>,
    destroyed: false,
    updateSettings(settings: Record<string, unknown>): void {
      fake.settings = deepMerge(fake.settings, settings);
    },
    on(event: string, cb: () => void): void {
      const arr = listeners.get(event) ?? [];
      arr.push(cb);
      listeners.set(event, arr);
    },
    emit(event: string): void {
      (listeners.get(event) ?? []).forEach((cb) => {
        cb();
      });
    },
    initialize(): void {},
    setAutoPlay(): void {},
    attachSource(): void {},
    setProtectionData(): void {},
    getRepresentationsByType(): DashRepresentationLike[] {
      return [{ index: 0, bandwidth: 1_000_000, width: 1280, height: 720, frameRate: 30, codecs: null }];
    },
    getTracksFor(): unknown[] {
      return [];
    },
    setRepresentationForTypeByIndex(): void {},
    reset(): void {
      fake.destroyed = true;
    },
  };
  return fake;
}
type FakeDashPlayer = ReturnType<typeof createFakeDashPlayer>;

function FakeMediaPlayer(): { create: () => FakeDashPlayer } {
  return { create: () => createFakeDashPlayer() };
}
FakeMediaPlayer.events = { STREAM_INITIALIZED: "streamInitialized" };

const fakeDashjs = {
  MediaPlayer: FakeMediaPlayer,
  Debug: { LOG_LEVEL_NONE: 0 },
};

@Component({
  selector: "eva-test-host",
  imports: [EvaPlayer, EvaDashDirective],
  template: `
    <eva-player evaDash id="test" [evaDashSrc]="dashSrc()" [evaDashConfig]="dashConfig()" [evaVideoSources]="sources()" />
  `,
})
class TestHostComponent {
  public readonly sources = signal([{ src: "", type: "video/mp4" }]);
  public readonly dashSrc = signal("https://example.com/stream.mpd");
  public readonly dashConfig = signal<Record<string, unknown>>({});
}

describe("DashDirective", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let originalDashjs: unknown;

  beforeEach(async () => {
    originalDashjs = (globalThis as Record<string, unknown>)["dashjs"];
    (globalThis as Record<string, unknown>)["dashjs"] = fakeDashjs;

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>)["dashjs"] = originalDashjs;
  });

  it("should create an instance", () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("does not let evaDashConfig's own `streaming` key clobber the default subtitle-suppression setting", async () => {
    fixture.componentInstance.dashConfig.set({ streaming: { abr: { autoSwitchBitrate: { video: false } } } });
    fixture.detectChanges();
    await fixture.whenStable();

    const dashDirective = fixture.debugElement.query(By.directive(EvaDashDirective)).injector.get(EvaDashDirective);
    const player = dashDirective.getDashInstance() as FakeDashPlayer;
    const streamingSettings = player.settings["streaming"] as Record<string, unknown>;

    /* The unrelated ABR override must apply, without wiping out the directive's own default that keeps manifest subtitles hidden. */
    expect(streamingSettings["abr"]).toEqual({ autoSwitchBitrate: { video: false } });
    expect(streamingSettings["text"]).toEqual({ defaultEnabled: false });
  });

  it("clears the registered quality levels when the stream is torn down on a source change", async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const dashDirective = fixture.debugElement.query(By.directive(EvaDashDirective)).injector.get(EvaDashDirective);
    const player = dashDirective.getDashInstance() as FakeDashPlayer;
    player.emit(fakeDashjs.MediaPlayer.events.STREAM_INITIALIZED);

    const evaApi = fixture.debugElement.query(By.directive(EvaPlayer)).injector.get(EvaApi);
    expect(evaApi.qualityLevelsSubject.value.length).toBeGreaterThan(0);

    fixture.componentInstance.dashSrc.set("https://example.com/stream2.mpd");
    fixture.detectChanges();

    expect(evaApi.qualityLevelsSubject.value).toEqual([]);
  });
});
