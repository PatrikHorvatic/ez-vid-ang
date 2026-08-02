import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EvaEndedOverlay } from "./ended-overlay";
import { EvaApi } from "../../api/eva-api";

describe("EndedOverlay", () => {
  let component: EvaEndedOverlay;
  let fixture: ComponentFixture<EvaEndedOverlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaEndedOverlay],
      providers: [EvaApi],
    }).compileComponents();

    fixture = TestBed.createComponent(EvaEndedOverlay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
