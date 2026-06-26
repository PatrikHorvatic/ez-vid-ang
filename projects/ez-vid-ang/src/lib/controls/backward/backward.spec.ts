import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EvaBackward } from './backward';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('BackwardComponent', () => {
  let component: EvaBackward;
  let fixture: ComponentFixture<EvaBackward>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaBackward], providers: [EvaApi, EvaFullscreenAPI]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaBackward);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
