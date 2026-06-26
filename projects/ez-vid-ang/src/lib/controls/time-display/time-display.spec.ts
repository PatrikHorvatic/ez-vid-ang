import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EvaTimeDisplay } from './time-display';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaTimeDisplay', () => {
  let component: EvaTimeDisplay;
  let fixture: ComponentFixture<EvaTimeDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaTimeDisplay],
      providers: [EvaApi, EvaFullscreenAPI]
    }).compileComponents();

    fixture = TestBed.createComponent(EvaTimeDisplay);
    fixture.componentRef.setInput('evaTimeProperty', 'current');
    fixture.componentRef.setInput('evaTimeFormating', 'mm:ss');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
