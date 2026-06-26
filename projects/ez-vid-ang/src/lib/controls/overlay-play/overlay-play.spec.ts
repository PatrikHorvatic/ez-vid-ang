import { TestBed, ComponentFixture } from '@angular/core/testing';

import { EvaOverlayPlay } from './overlay-play';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('OverlayPlayComponent', () => {
  let component: EvaOverlayPlay;
  let fixture: ComponentFixture<EvaOverlayPlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaOverlayPlay], providers: [EvaApi, EvaFullscreenAPI]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaOverlayPlay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
