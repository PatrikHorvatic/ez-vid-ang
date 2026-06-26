import { TestBed, ComponentFixture } from '@angular/core/testing';

import { EvaPlayPause } from './play-pause';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaPlayPause', () => {
  let component: EvaPlayPause;
  let fixture: ComponentFixture<EvaPlayPause>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaPlayPause], providers: [EvaApi, EvaFullscreenAPI]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaPlayPause);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
