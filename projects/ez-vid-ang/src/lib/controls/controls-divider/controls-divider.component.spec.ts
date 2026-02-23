import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlsDividerComponent } from './controls-divider.component';

describe('ControlsDividerComponent', () => {
  let component: ControlsDividerComponent;
  let fixture: ComponentFixture<ControlsDividerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ControlsDividerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ControlsDividerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
