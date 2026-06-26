import { TestBed, ComponentFixture } from '@angular/core/testing';

import { EvaMute } from './mute';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaMute', () => {
  let component: EvaMute;
  let fixture: ComponentFixture<EvaMute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaMute], providers: [EvaApi, EvaFullscreenAPI]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaMute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
