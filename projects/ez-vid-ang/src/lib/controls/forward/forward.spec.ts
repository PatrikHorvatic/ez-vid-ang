import { TestBed, ComponentFixture } from '@angular/core/testing';

import { EvaForward } from './forward';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaForward', () => {
  let component: EvaForward;
  let fixture: ComponentFixture<EvaForward>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaForward], providers: [EvaApi, EvaFullscreenAPI]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaForward);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
