import { TestBed, ComponentFixture } from '@angular/core/testing';

import { EvaScrubBarBufferingTime } from './scrub-bar-buffering-time';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('ScrubBarBufferingTimeComponent', () => {
  let component: EvaScrubBarBufferingTime;
  let fixture: ComponentFixture<EvaScrubBarBufferingTime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaScrubBarBufferingTime], providers: [EvaApi, EvaFullscreenAPI]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaScrubBarBufferingTime);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
