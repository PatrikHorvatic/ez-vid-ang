import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EvaControlsContainer } from './controls-container';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaControlsContainerComponent', () => {
  let component: EvaControlsContainer;
  let fixture: ComponentFixture<EvaControlsContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaControlsContainer], providers: [EvaApi, EvaFullscreenAPI]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaControlsContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
