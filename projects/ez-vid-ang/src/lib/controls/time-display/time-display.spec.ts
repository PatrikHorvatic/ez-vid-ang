import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeDisplay } from './time-display';

describe('TimeDisplay', () => {
  let component: TimeDisplay;
  let fixture: ComponentFixture<TimeDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
