import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EvaCinemaMode } from './cinema-mode';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaCinemaMode', () => {
  let component: EvaCinemaMode;
  let fixture: ComponentFixture<EvaCinemaMode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaCinemaMode],
      providers: [EvaApi, EvaFullscreenAPI]
    }).compileComponents();

    fixture = TestBed.createComponent(EvaCinemaMode);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
