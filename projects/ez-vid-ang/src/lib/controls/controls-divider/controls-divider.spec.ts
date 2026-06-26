import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EvaControlsDivider } from './controls-divider';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('ControlsDividerComponent', () => {
  let component: EvaControlsDivider;
  let fixture: ComponentFixture<EvaControlsDivider>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaControlsDivider], providers: [EvaApi, EvaFullscreenAPI]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaControlsDivider);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
