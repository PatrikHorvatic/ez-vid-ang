import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaTimeDisplay } from './time-display';

describe('EvaTimeDisplay', () => {
  let component: EvaTimeDisplay;
  let fixture: ComponentFixture<EvaTimeDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaTimeDisplay]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaTimeDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
