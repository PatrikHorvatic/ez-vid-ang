import { TestBed, ComponentFixture } from '@angular/core/testing';

import { EvaQualitySelector } from './quality-selector';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaQualitySelector', () => {
  let component: EvaQualitySelector;
  let fixture: ComponentFixture<EvaQualitySelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaQualitySelector], providers: [EvaApi, EvaFullscreenAPI]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaQualitySelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
