import { TestBed, ComponentFixture } from "@angular/core/testing";

import { EvaQualitySelector } from "./quality-selector";
import { EvaAudioTrackSelector } from "../audio-track-selector/audio-track-selector";
import { EvaApi } from "../../api/eva-api";
import { EvaFullscreenAPI } from "../../api/fullscreen";

describe("EvaQualitySelector", () => {
  let component: EvaQualitySelector;
  let fixture: ComponentFixture<EvaQualitySelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaQualitySelector, EvaAudioTrackSelector],
      providers: [EvaApi, EvaFullscreenAPI],
    }).compileComponents();

    fixture = TestBed.createComponent(EvaQualitySelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("reflects a quality change made externally (e.g. keyboard shortcut or ABR auto-switch), not just local selection", () => {
    const evaApi = fixture.debugElement.injector.get(EvaApi);
    evaApi.qualityLevelsSubject.next([
      { qualityIndex: -1, label: "Auto", isAuto: true, width: 0, height: 0, bitrate: 0, mediaType: "video" },
      { qualityIndex: 0, label: "1080p", isAuto: false, width: 1920, height: 1080, bitrate: 5000000, mediaType: "video" },
      { qualityIndex: 1, label: "720p", isAuto: false, width: 1280, height: 720, bitrate: 2500000, mediaType: "video" },
    ]);
    fixture.detectChanges();

    // Simulate EvaApi.setQuality() being called from outside this component entirely.
    evaApi.currentQualityIndex.set(1);
    fixture.detectChanges();

    const currentQuality = (component as unknown as { currentQuality: () => { label: string } | null }).currentQuality();
    expect(currentQuality?.label).toBe("720p");
  });

  it("closes when a sibling dropdown (EvaAudioTrackSelector) opens, via EvaApi's mutual-exclusion mechanism", () => {
    const audioFixture = TestBed.createComponent(EvaAudioTrackSelector);
    audioFixture.detectChanges();

    const qualityIsOpen = (): boolean => (component as unknown as { isOpen: () => boolean }).isOpen();
    const audioIsOpen = (): boolean => (audioFixture.componentInstance as unknown as { isOpen: () => boolean }).isOpen();

    (component as unknown as { onClicked: () => void }).onClicked();
    fixture.detectChanges();
    expect(qualityIsOpen()).toBe(true);

    (audioFixture.componentInstance as unknown as { onClicked: () => void }).onClicked();
    audioFixture.detectChanges();
    fixture.detectChanges();

    expect(audioIsOpen()).toBe(true);
    expect(qualityIsOpen()).toBe(false);
  });
});
