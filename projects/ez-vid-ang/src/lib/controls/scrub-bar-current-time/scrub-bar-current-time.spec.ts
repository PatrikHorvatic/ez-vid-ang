import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EvaScrubBarCurrentTime } from './scrub-bar-current-time';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('ScrubBarCurrentTimeComponent', () => {
  let component: EvaScrubBarCurrentTime;
  let fixture: ComponentFixture<EvaScrubBarCurrentTime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaScrubBarCurrentTime], providers: [EvaApi, EvaFullscreenAPI]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaScrubBarCurrentTime);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
