import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EvaPlaybackSpeed } from './playback-speed';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaPlaybackSpeed', () => {
  let component: EvaPlaybackSpeed;
  let fixture: ComponentFixture<EvaPlaybackSpeed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaPlaybackSpeed],
      providers: [EvaApi, EvaFullscreenAPI]
    }).compileComponents();

    fixture = TestBed.createComponent(EvaPlaybackSpeed);
    fixture.componentRef.setInput('evaPlaybackSpeeds', [1]);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
