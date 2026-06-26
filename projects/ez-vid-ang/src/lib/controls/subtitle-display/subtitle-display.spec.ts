import { TestBed, ComponentFixture } from '@angular/core/testing';

import { EvaSubtitleDisplay } from './subtitle-display';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaSubtitleDisplay', () => {
  let component: EvaSubtitleDisplay;
  let fixture: ComponentFixture<EvaSubtitleDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaSubtitleDisplay], providers: [EvaApi, EvaFullscreenAPI]
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
