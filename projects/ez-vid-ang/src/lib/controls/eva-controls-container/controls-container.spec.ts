import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvaControlsContainer } from './controls-container';

describe('EvaControlsContainerComponent', () => {
  let component: EvaControlsContainer;
  let fixture: ComponentFixture<EvaControlsContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaControlsContainer]
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
