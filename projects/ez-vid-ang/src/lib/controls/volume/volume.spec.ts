import { TestBed, ComponentFixture } from '@angular/core/testing';

import { EvaVolume } from './volume';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('Volume', () => {
  let component: EvaVolume;
  let fixture: ComponentFixture<EvaVolume>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaVolume], providers: [EvaApi, EvaFullscreenAPI]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaVolume);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
