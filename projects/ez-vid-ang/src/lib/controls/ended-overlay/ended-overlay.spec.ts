import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaEndedOverlay } from './ended-overlay';

describe('EndedOverlay', () => {
  let component: EvaEndedOverlay;
  let fixture: ComponentFixture<EvaEndedOverlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaEndedOverlay]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaEndedOverlay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
