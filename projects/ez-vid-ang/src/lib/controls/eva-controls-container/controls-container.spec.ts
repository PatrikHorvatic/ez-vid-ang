import { TestBed, ComponentFixture } from "@angular/core/testing";
import { EvaControlsContainer } from "./controls-container";
import { EvaApi } from "../../api/eva-api";
import { EvaFullscreenAPI } from "../../api/fullscreen";

describe("EvaControlsContainerComponent", () => {
  let component: EvaControlsContainer;
  let fixture: ComponentFixture<EvaControlsContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaControlsContainer],
      providers: [EvaApi, EvaFullscreenAPI],
    }).compileComponents();

    fixture = TestBed.createComponent(EvaControlsContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  const AUTOHIDE_TEST_TIME_MS = 10;
  const AFTER_AUTOHIDE_MS = 40;

  async function wait(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  it("does not auto-hide once auto-hide is enabled while a menu was already open (claimed before subscribing)", async () => {
    const evaApi = fixture.debugElement.injector.get(EvaApi);
    const selectorId = Symbol("already-open-menu");
    evaApi.claimSelector(selectorId);

    fixture.componentRef.setInput("evaAutohideTime", AUTOHIDE_TEST_TIME_MS);
    fixture.componentRef.setInput("evaAutohide", true);
    fixture.detectChanges();

    evaApi.triggerUserInteraction.next(new MouseEvent("mousemove"));
    await wait(AFTER_AUTOHIDE_MS);

    const hideControls = (component as unknown as { hideControls: () => boolean }).hideControls;
    expect(hideControls()).toBe(false);
  });
});
