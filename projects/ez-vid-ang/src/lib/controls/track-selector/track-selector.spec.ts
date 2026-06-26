import { TestBed, ComponentFixture } from '@angular/core/testing';

import { EvaTrackSelector } from './track-selector';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('TrackSelector', () => {
  let component: EvaTrackSelector;
  let fixture: ComponentFixture<EvaTrackSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaTrackSelector], providers: [EvaApi, EvaFullscreenAPI]
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
