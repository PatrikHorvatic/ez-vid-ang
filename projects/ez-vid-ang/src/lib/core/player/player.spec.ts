import { TestBed, ComponentFixture } from "@angular/core/testing";
import { Component, signal } from "@angular/core";
import { By } from "@angular/platform-browser";
import { vi } from "vitest";
import { EvaPlayer } from "./player";
import { EvaApi } from "../../api/eva-api";
import { EvaState } from "../../types";

@Component({
  selector: "eva-test-host",
  imports: [EvaPlayer],
  template: `
    <eva-player id="test" [evaVideoSources]="sources()" />
  `,
})
class TestHostComponent {
  public readonly sources = signal([{ src: "", type: "video/mp4" }]);
}

describe("Player", () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("reloads the video element with the already-updated source when evaVideoSources changes to genuinely different content at runtime", async () => {
    const video = (fixture.nativeElement as HTMLElement).querySelector<HTMLVideoElement>("video")!;
    let sourceSrcAtLoadTime: string | null = null;
    const loadSpy = vi.spyOn(video, "load").mockImplementation(() => {
      sourceSrcAtLoadTime = video.querySelector("source")?.getAttribute("src") ?? null;
    });
    await fixture.whenStable();
    expect(loadSpy).not.toHaveBeenCalled();

    fixture.componentInstance.sources.set([{ src: "other.mp4", type: "video/mp4" }]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(loadSpy).toHaveBeenCalledTimes(1);
    /* Confirms .load() is called only after the <source> elements' own bindings have already
     * been updated to the new value — otherwise it would just reload the stale source. */
    expect(sourceSrcAtLoadTime).toBe("other.mp4");
  });

  it("does not reload the video element when evaVideoSources is replaced with an equivalent array (reference-only change)", async () => {
    const video = (fixture.nativeElement as HTMLElement).querySelector<HTMLVideoElement>("video")!;
    const loadSpy = vi.spyOn(video, "load");
    await fixture.whenStable();

    fixture.componentInstance.sources.set([...fixture.componentInstance.sources()]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(loadSpy).not.toHaveBeenCalled();
  });

  it("resets the playback state away from a stale PLAYING when evaVideoSources changes mid-playback", async () => {
    const video = (fixture.nativeElement as HTMLElement).querySelector<HTMLVideoElement>("video")!;
    vi.spyOn(video, "load").mockImplementation(() => {
      /* HTMLMediaElement.load() never fires a "pause" event even mid-playback — this no-op
       * stub mirrors that exactly, so the test only passes if EvaPlayer corrects the state
       * itself rather than relying on a native event that will never come. */
    });
    await fixture.whenStable();

    const evaApi = fixture.debugElement.query(By.directive(EvaPlayer)).injector.get(EvaApi);
    evaApi.videoStateSubject.next(EvaState.PLAYING);

    fixture.componentInstance.sources.set([{ src: "other.mp4", type: "video/mp4" }]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(evaApi.videoStateSubject.value).toBe(EvaState.LOADING);
  });
});
