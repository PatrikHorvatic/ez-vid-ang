import { TestBed, ComponentFixture } from '@angular/core/testing';

import { EvaPictureInPicture } from './picture-in-picture';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaPictureInPicture', () => {
  let component: EvaPictureInPicture;
  let fixture: ComponentFixture<EvaPictureInPicture>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaPictureInPicture], providers: [EvaApi, EvaFullscreenAPI]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaPictureInPicture);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
