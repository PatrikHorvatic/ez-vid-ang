import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaControlsContainerComponent } from './controls-container.component';

describe('EvaControlsContainerComponent', () => {
  let component: EvaControlsContainerComponent;
  let fixture: ComponentFixture<EvaControlsContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaControlsContainerComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaControlsContainerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
