import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EvaBuffering } from './buffering';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('BufferingComponent', () => {
  let component: EvaBuffering;
  let fixture: ComponentFixture<EvaBuffering>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaBuffering], providers: [EvaApi, EvaFullscreenAPI]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaBuffering);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
