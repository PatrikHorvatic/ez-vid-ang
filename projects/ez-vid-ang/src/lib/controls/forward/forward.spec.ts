import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaForward } from './forward';

describe('EvaForward', () => {
  let component: EvaForward;
  let fixture: ComponentFixture<EvaForward>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaForward]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaForward);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
