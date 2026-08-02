import { TestBed, ComponentFixture } from "@angular/core/testing";

import { EvaScrubBar } from "./scrub-bar";
import { EvaApi } from "../../api/eva-api";
import { EvaFullscreenAPI } from "../../api/fullscreen";

const AUTO_HIDE_TEST_DELAY_MS = 40;
const TEST_AUTOHIDE_TIME_MS = 10;

async function wait(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe("EvaScrubBar", () => {
  let component: EvaScrubBar;
  let fixture: ComponentFixture<EvaScrubBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaScrubBar],
      providers: [EvaApi, EvaFullscreenAPI],
    }).compileComponents();

    fixture = TestBed.createComponent(EvaScrubBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("only auto-hides once hideWithControlsContainer is enabled, including via a runtime toggle", async () => {
    const evaApi = fixture.debugElement.injector.get(EvaApi);
    fixture.componentRef.setInput("evaAutohideTime", TEST_AUTOHIDE_TIME_MS);
    fixture.componentRef.setInput("hideWithControlsContainer", false);
    fixture.detectChanges();
    await fixture.whenStable();

    const hideControls = (component as unknown as { hideControls: () => boolean }).hideControls;

    evaApi.triggerUserInteraction.next(new MouseEvent("mousemove"));
    await wait(AUTO_HIDE_TEST_DELAY_MS);
    expect(hideControls()).toBe(false);

    /* Toggling the input at runtime must activate auto-hide without remounting the component. */
    fixture.componentRef.setInput("hideWithControlsContainer", true);
    fixture.detectChanges();

    evaApi.triggerUserInteraction.next(new MouseEvent("mousemove"));
    await wait(AUTO_HIDE_TEST_DELAY_MS);
    expect(hideControls()).toBe(true);
  });

  it("activates chapter tracking when evaShowChapters flips from false to true at runtime", async () => {
    /*
     * Uses its own fixture (rather than the shared one from beforeEach) so evaShowChapters
     * can be set to false before the component's very first change-detection cycle —
     * its default is true, and the shared fixture is already past that point by the time
     * an it() body runs.
     */
    const localFixture = TestBed.createComponent(EvaScrubBar);
    localFixture.componentRef.setInput("evaShowChapters", false);
    localFixture.detectChanges();
    await localFixture.whenStable();

    const evaApi = localFixture.debugElement.injector.get(EvaApi);
    const chapters = (localFixture.componentInstance as unknown as { chapters: () => { startTime: number; endTime: number; title: string }[] }).chapters;

    evaApi.chapterMarkerChangesSubject.next([{ startTime: 0, endTime: 10, title: "Intro" }]);
    localFixture.detectChanges();
    expect(chapters()).toEqual([]);

    localFixture.componentRef.setInput("evaShowChapters", true);
    localFixture.detectChanges();

    evaApi.chapterMarkerChangesSubject.next([{ startTime: 0, endTime: 10, title: "Intro" }]);
    localFixture.detectChanges();
    expect(chapters().length).toBe(1);
  });
});
