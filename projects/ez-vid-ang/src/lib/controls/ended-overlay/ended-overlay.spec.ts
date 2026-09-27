import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EvaEndedOverlay } from "./ended-overlay";
import { EvaApi } from "../../api/eva-api";
import { EvaState } from "../../types";

describe("EndedOverlay", () => {
  let component: EvaEndedOverlay;
  let fixture: ComponentFixture<EvaEndedOverlay>;
  let evaApi: EvaApi;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaEndedOverlay],
      providers: [EvaApi],
    }).compileComponents();

    fixture = TestBed.createComponent(EvaEndedOverlay);
    component = fixture.componentInstance;
    evaApi = fixture.debugElement.injector.get(EvaApi);

    const video = document.createElement("video");
    evaApi.assignElementToApi(video);
    evaApi.onPlayerReady();

    await fixture.whenStable();
  });

  const isVisible = (): boolean => (component as unknown as { isVisible: () => boolean }).isVisible();

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("becomes visible when the video ends and loop is off", () => {
    evaApi.videoStateSubject.next(EvaState.ENDED);
    expect(isVisible()).toBe(true);
  });

  it("clears a stale visible state once loop is turned on and the video resumes playing", () => {
    evaApi.videoStateSubject.next(EvaState.ENDED);
    expect(isVisible()).toBe(true);

    evaApi.assignedVideoElement!.loop = true;
    evaApi.videoStateSubject.next(EvaState.PLAYING);

    expect(isVisible()).toBe(false);
  });
});
