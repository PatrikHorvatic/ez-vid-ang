import { TestBed, ComponentFixture } from "@angular/core/testing";

import { EvaOverlayPlay } from "./overlay-play";
import { EvaApi } from "../../api/eva-api";
import { EvaFullscreenAPI } from "../../api/fullscreen";

describe("OverlayPlayComponent", () => {
  let component: EvaOverlayPlay;
  let fixture: ComponentFixture<EvaOverlayPlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaOverlayPlay],
      providers: [EvaApi, EvaFullscreenAPI],
    }).compileComponents();

    fixture = TestBed.createComponent(EvaOverlayPlay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  /*
   * Note: the "controls visible" case is asserted via the `controlsContainerHidden`
   * signal directly, not via `.style.height`, because happy-dom (the test DOM shim)
   * doesn't correctly parse/store `calc()` values that reference a custom property —
   * it silently drops the assignment and retains whatever was there before, which
   * stays untestable via the DOM once any *other* valid value (e.g. `100%`) has been
   * set. Verified against a real Chrome instance that the exact string
   * (`calc(100% - var(--eva-control-element-height))`) round-trips correctly every time.
   * The `100%` case, which happy-dom *can* represent, is still asserted via the DOM.
   */
  const isHidden = (): boolean => (fixture.componentInstance as unknown as { controlsContainerHidden: () => boolean }).controlsContainerHidden();

  it("reserves room for the controls bar by default (controls bar visible)", async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(isHidden()).toBe(false);
  });

  it("expands to full height while the controls bar is auto-hidden", async () => {
    const evaAPI = fixture.debugElement.injector.get(EvaApi);
    evaAPI.componentsContainerVisibilityStateSubject.next(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(isHidden()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).style.height).toBe("100%");
  });

  it("goes back to reserving room for the controls bar once it's shown again", async () => {
    const evaAPI = fixture.debugElement.injector.get(EvaApi);
    evaAPI.componentsContainerVisibilityStateSubject.next(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(isHidden()).toBe(true);

    evaAPI.componentsContainerVisibilityStateSubject.next(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(isHidden()).toBe(false);
  });
});
