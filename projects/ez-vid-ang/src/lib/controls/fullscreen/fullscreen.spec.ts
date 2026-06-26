import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EvaFullscreen } from './fullscreen';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaFullscreen', () => {
  let component: EvaFullscreen;
  let fixture: ComponentFixture<EvaFullscreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaFullscreen],
      providers: [EvaApi, EvaFullscreenAPI]
    }).compileComponents();

    fixture = TestBed.createComponent(EvaFullscreen);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
