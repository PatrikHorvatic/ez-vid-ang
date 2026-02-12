import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaTrackSelector } from './track-selector';

describe('TrackSelector', () => {
  let component: EvaTrackSelector;
  let fixture: ComponentFixture<EvaTrackSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaTrackSelector]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaTrackSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
