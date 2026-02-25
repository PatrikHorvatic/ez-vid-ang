import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaSubtitleDisplay } from './subtitle-display.component';

describe('EvaSubtitleDisplay', () => {
  let component: EvaSubtitleDisplay;
  let fixture: ComponentFixture<EvaSubtitleDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaSubtitleDisplay]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaSubtitleDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
