import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EvaErrorOverlay } from './error-overlay';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaErrorOverlay', () => {
  let component: EvaErrorOverlay;
  let fixture: ComponentFixture<EvaErrorOverlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaErrorOverlay],
      providers: [EvaApi, EvaFullscreenAPI]
    }).compileComponents();

    fixture = TestBed.createComponent(EvaErrorOverlay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
