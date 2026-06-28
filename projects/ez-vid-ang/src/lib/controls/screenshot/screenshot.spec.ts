import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EvaScreenshot } from './screenshot';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaScreenshot', () => {
  let component: EvaScreenshot;
  let fixture: ComponentFixture<EvaScreenshot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaScreenshot],
      providers: [EvaApi, EvaFullscreenAPI]
    }).compileComponents();

    fixture = TestBed.createComponent(EvaScreenshot);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
