import { Component } from "@angular/core";
import { TestBed, ComponentFixture } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { vi } from "vitest";

import { EvaDoubleTapSeek } from "./double-tap-seek";
import { EvaApi } from "../../api/eva-api";
import { EvaFullscreenAPI } from "../../api/fullscreen";
import { DEFAULT_SEEK_SECONDS, DOUBLE_TAP_RIPPLE_DURATION_MS, DOUBLE_TAP_THRESHOLD_MS } from "../../constants";

const AFTER_THRESHOLD_MS_BUFFER = 40;
const AFTER_THRESHOLD_MS = DOUBLE_TAP_THRESHOLD_MS + AFTER_THRESHOLD_MS_BUFFER;
const AFTER_DEFAULT_RIPPLE_DURATION_MS = DOUBLE_TAP_RIPPLE_DURATION_MS + AFTER_THRESHOLD_MS_BUFFER;
const ACCUMULATED_TWO_TAPS_SECONDS = DEFAULT_SEEK_SECONDS + DEFAULT_SEEK_SECONDS;
const CUSTOM_SEEK_SECONDS = 30;
const EXPECTED_SEEK_CALL_COUNT_AFTER_TRIPLE_TAP = 2;

async function wait(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe("EvaDoubleTapSeek", () => {
  let component: EvaDoubleTapSeek;
  let fixture: ComponentFixture<EvaDoubleTapSeek>;
  let evaAPI: EvaApi;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaDoubleTapSeek],
      providers: [EvaApi, EvaFullscreenAPI],
    }).compileComponents();

    fixture = TestBed.createComponent(EvaDoubleTapSeek);
    component = fixture.componentInstance;
    evaAPI = fixture.debugElement.injector.get(EvaApi);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function tap(side: "left" | "right"): boolean {
    const zone = fixture.debugElement.query(By.css(side === "left" ? ".eva-tap-zone-left" : ".eva-tap-zone-right")).nativeElement as HTMLElement;
    const event = new Event("touchend", { cancelable: true, bubbles: true });
    const dispatchResult = zone.dispatchEvent(event);
    fixture.detectChanges();
    return dispatchResult;
  }

  const activeSide = (): "left" | "right" | null => (component as unknown as { activeSide: () => "left" | "right" | null }).activeSide();
  const accumulatedSeconds = (): number => (component as unknown as { accumulatedSeconds: () => number }).accumulatedSeconds();

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("toggles play/pause on a single tap that is not followed by a second one", async () => {
    const playOrPauseSpy = vi.spyOn(evaAPI, "playOrPauseVideo");

    tap("left");
    expect(playOrPauseSpy).not.toHaveBeenCalled();

    await wait(AFTER_THRESHOLD_MS);
    expect(playOrPauseSpy).toHaveBeenCalledTimes(1);
  });

  it("seeks backward on a double tap on the left zone instead of toggling play twice", async () => {
    const seekBackSpy = vi.spyOn(evaAPI, "seekBack");
    const playOrPauseSpy = vi.spyOn(evaAPI, "playOrPauseVideo");

    tap("left");
    tap("left");

    expect(seekBackSpy).toHaveBeenCalledTimes(1);
    expect(seekBackSpy).toHaveBeenCalledWith(DEFAULT_SEEK_SECONDS);
    expect(activeSide()).toBe("left");
    expect(accumulatedSeconds()).toBe(DEFAULT_SEEK_SECONDS);

    await wait(AFTER_THRESHOLD_MS);
    expect(playOrPauseSpy).not.toHaveBeenCalled();
  });

  it("seeks forward on a double tap on the right zone", () => {
    const seekForwardSpy = vi.spyOn(evaAPI, "seekForward");

    tap("right");
    tap("right");

    expect(seekForwardSpy).toHaveBeenCalledTimes(1);
    expect(seekForwardSpy).toHaveBeenCalledWith(DEFAULT_SEEK_SECONDS);
    expect(activeSide()).toBe("right");
    expect(accumulatedSeconds()).toBe(DEFAULT_SEEK_SECONDS);
  });

  it("accumulates the seek amount on a rapid third tap on the same side", () => {
    const seekBackSpy = vi.spyOn(evaAPI, "seekBack");

    tap("left");
    tap("left");
    tap("left");

    expect(seekBackSpy).toHaveBeenCalledTimes(EXPECTED_SEEK_CALL_COUNT_AFTER_TRIPLE_TAP);
    expect(accumulatedSeconds()).toBe(ACCUMULATED_TWO_TAPS_SECONDS);
  });

  it("resets the accumulated label once no further tap arrives within the threshold", async () => {
    tap("left");
    tap("left");
    expect(accumulatedSeconds()).toBe(DEFAULT_SEEK_SECONDS);

    await wait(AFTER_THRESHOLD_MS);

    expect(activeSide()).toBeNull();
    expect(accumulatedSeconds()).toBe(0);
  });

  it("switching sides mid-sequence starts a fresh sequence for the new side", () => {
    const seekBackSpy = vi.spyOn(evaAPI, "seekBack");
    const seekForwardSpy = vi.spyOn(evaAPI, "seekForward");

    tap("left");
    tap("left");
    expect(activeSide()).toBe("left");

    // A single tap on the other side is just the start of a new sequence — not a seek yet.
    tap("right");
    expect(seekForwardSpy).not.toHaveBeenCalled();
    expect(seekBackSpy).toHaveBeenCalledTimes(1);
  });

  it("prevents the default touchend behavior so no synthetic click reaches elements underneath", () => {
    const zone = fixture.debugElement.query(By.css(".eva-tap-zone-left")).nativeElement as HTMLElement;
    const event = new Event("touchend", { cancelable: true, bubbles: true });
    zone.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("forwards the tap to EvaApi.triggerUserInteraction so controls-bar auto-hide keeps resetting", () => {
    const interactionValues: unknown[] = [];
    const sub = evaAPI.triggerUserInteraction.subscribe((value) => {
      interactionValues.push(value);
    });

    tap("left");

    expect(interactionValues.length).toBe(1);
    sub.unsubscribe();
  });

  it("respects a custom evaDoubleTapSeekSeconds input", () => {
    fixture.componentRef.setInput("evaDoubleTapSeekSeconds", CUSTOM_SEEK_SECONDS);
    fixture.detectChanges();

    const seekForwardSpy = vi.spyOn(evaAPI, "seekForward");
    tap("right");
    tap("right");

    expect(seekForwardSpy).toHaveBeenCalledWith(CUSTOM_SEEK_SECONDS);
    expect(accumulatedSeconds()).toBe(CUSTOM_SEEK_SECONDS);
  });

  const ripples = (): unknown[] => (component as unknown as { ripples: () => unknown[] }).ripples();

  it("removes the ripple after the default duration when evaRippleDurationMs is unset", async () => {
    tap("left");
    tap("left");
    expect(ripples().length).toBe(1);

    await wait(AFTER_DEFAULT_RIPPLE_DURATION_MS);
    expect(ripples().length).toBe(0);
  });

  it("respects a custom evaRippleDurationMs, removing the ripple sooner than the default", async () => {
    const shortDurationMs = 50;
    fixture.componentRef.setInput("evaRippleDurationMs", shortDurationMs);
    fixture.detectChanges();

    tap("left");
    tap("left");
    expect(ripples().length).toBe(1);

    await wait(shortDurationMs + AFTER_THRESHOLD_MS_BUFFER);
    expect(ripples().length).toBe(0);
  });

  it("exposes evaRippleDurationMs as the --eva-double-tap-ripple-duration CSS custom property", () => {
    const customDurationMs = 1200;
    fixture.componentRef.setInput("evaRippleDurationMs", customDurationMs);
    fixture.detectChanges();

    const hostStyle = (fixture.nativeElement as HTMLElement).style;
    expect(hostStyle.getPropertyValue("--eva-double-tap-ripple-duration")).toBe(`${customDurationMs}ms`);
  });

  it("clamps a negative evaRippleDurationMs to 0 via transformTimeoutDuration", () => {
    const negativeDurationMs = -500;
    fixture.componentRef.setInput("evaRippleDurationMs", negativeDurationMs);
    fixture.detectChanges();

    const hostStyle = (fixture.nativeElement as HTMLElement).style;
    expect(hostStyle.getPropertyValue("--eva-double-tap-ripple-duration")).toBe("0ms");
  });

  const isControlsBarHidden = (): boolean => (fixture.componentInstance as unknown as { controlsContainerHidden: () => boolean }).controlsContainerHidden();

  it("reserves room for the controls bar by default, mirroring EvaOverlayPlay's sizing", () => {
    expect(isControlsBarHidden()).toBe(false);
  });

  it("expands to full height while the controls bar is auto-hidden", () => {
    evaAPI.componentsContainerVisibilityStateSubject.next(true);
    fixture.detectChanges();

    expect(isControlsBarHidden()).toBe(true);
  });
});

describe("EvaDoubleTapSeek ripple toggle", () => {
  let component: EvaDoubleTapSeek;
  let fixture: ComponentFixture<EvaDoubleTapSeek>;
  let evaAPI: EvaApi;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaDoubleTapSeek],
      providers: [EvaApi, EvaFullscreenAPI],
    }).compileComponents();

    fixture = TestBed.createComponent(EvaDoubleTapSeek);
    component = fixture.componentInstance;
    evaAPI = fixture.debugElement.injector.get(EvaApi);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function tap(side: "left" | "right"): void {
    const zone = fixture.debugElement.query(By.css(side === "left" ? ".eva-tap-zone-left" : ".eva-tap-zone-right")).nativeElement as HTMLElement;
    zone.dispatchEvent(new Event("touchend", { cancelable: true, bubbles: true }));
    fixture.detectChanges();
  }

  const ripples = (): unknown[] => (component as unknown as { ripples: () => unknown[] }).ripples();
  const activeSide = (): "left" | "right" | null => (component as unknown as { activeSide: () => "left" | "right" | null }).activeSide();

  it("shows a ripple on a double tap by default", () => {
    tap("left");
    tap("left");

    expect(ripples().length).toBe(1);
  });

  it("does not spawn a ripple when evaRippleEnabled is set to false", () => {
    fixture.componentRef.setInput("evaRippleEnabled", false);
    fixture.detectChanges();

    tap("left");
    tap("left");

    expect(ripples().length).toBe(0);
    expect(activeSide()).toBe("left");
  });

  it("still seeks when evaRippleEnabled is false", () => {
    const seekBackSpy = vi.spyOn(evaAPI, "seekBack");
    fixture.componentRef.setInput("evaRippleEnabled", false);
    fixture.detectChanges();

    tap("left");
    tap("left");

    expect(seekBackSpy).toHaveBeenCalledWith(DEFAULT_SEEK_SECONDS);
  });

  it("can be toggled off and back on at runtime", async () => {
    fixture.componentRef.setInput("evaRippleEnabled", false);
    fixture.detectChanges();
    tap("left");
    tap("left");
    expect(ripples().length).toBe(0);

    /* Let the sequence reset so the next taps start a fresh double-tap, not a same-window repeat. */
    await wait(AFTER_THRESHOLD_MS);

    fixture.componentRef.setInput("evaRippleEnabled", true);
    fixture.detectChanges();
    tap("left");
    tap("left");
    expect(ripples().length).toBe(1);
  });
});

@Component({
  selector: "eva-test-host",
  imports: [EvaDoubleTapSeek],
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations -- test host needs both projected zones visible
  template: `
    <eva-double-tap-seek [evaCustomIcon]="true">
      <span evaSeekBackward class="custom-backward">custom-backward</span>
      <span evaSeekForward class="custom-forward">custom-forward</span>
    </eva-double-tap-seek>
  `,
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- purely presentational test host, no state needed
class CustomIconHostComponent {}

describe("EvaDoubleTapSeek custom icons", () => {
  let hostFixture: ComponentFixture<CustomIconHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomIconHostComponent],
      providers: [EvaApi, EvaFullscreenAPI],
    }).compileComponents();

    hostFixture = TestBed.createComponent(CustomIconHostComponent);
    hostFixture.detectChanges();
    await hostFixture.whenStable();
  });

  function tapHost(side: "left" | "right"): void {
    const zone = hostFixture.debugElement.query(By.css(side === "left" ? ".eva-tap-zone-left" : ".eva-tap-zone-right")).nativeElement as HTMLElement;
    zone.dispatchEvent(new Event("touchend", { cancelable: true, bubbles: true }));
    hostFixture.detectChanges();
  }

  it("projects the evaSeekBackward content instead of the registry icon on the left ripple", () => {
    tapHost("left");
    tapHost("left");
    hostFixture.detectChanges();

    const projected = hostFixture.debugElement.query(By.css(".custom-backward"));
    expect(projected).toBeTruthy();
    expect(hostFixture.debugElement.query(By.css("eva-icon"))).toBeNull();
  });

  it("projects the evaSeekForward content instead of the registry icon on the right ripple", () => {
    tapHost("right");
    tapHost("right");
    hostFixture.detectChanges();

    const projected = hostFixture.debugElement.query(By.css(".custom-forward"));
    expect(projected).toBeTruthy();
    expect(hostFixture.debugElement.query(By.css("eva-icon"))).toBeNull();
  });
});
