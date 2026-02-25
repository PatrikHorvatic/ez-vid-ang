import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaScrubBarBufferingTime } from './scrub-bar-buffering-time';

describe('ScrubBarBufferingTimeComponent', () => {
  let component: EvaScrubBarBufferingTime;
  let fixture: ComponentFixture<EvaScrubBarBufferingTime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaScrubBarBufferingTime]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaScrubBarBufferingTime);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
