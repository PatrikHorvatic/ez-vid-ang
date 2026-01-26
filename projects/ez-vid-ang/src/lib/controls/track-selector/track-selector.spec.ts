import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackSelector } from './track-selector';

describe('TrackSelector', () => {
  let component: TrackSelector;
  let fixture: ComponentFixture<TrackSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
