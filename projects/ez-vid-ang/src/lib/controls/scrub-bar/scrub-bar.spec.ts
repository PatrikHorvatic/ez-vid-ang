import { TestBed, ComponentFixture } from '@angular/core/testing';

import { EvaScrubBar } from './scrub-bar';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaScrubBar', () => {
  let component: EvaScrubBar;
  let fixture: ComponentFixture<EvaScrubBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaScrubBar], providers: [EvaApi, EvaFullscreenAPI]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaScrubBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
