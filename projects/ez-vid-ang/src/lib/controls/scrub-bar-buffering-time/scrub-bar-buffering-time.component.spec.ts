import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaScrubBarBufferingTimeComponent } from './scrub-bar-buffering-time.component';

describe('ScrubBarBufferingTimeComponent', () => {
  let component: EvaScrubBarBufferingTimeComponent;
  let fixture: ComponentFixture<EvaScrubBarBufferingTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaScrubBarBufferingTimeComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaScrubBarBufferingTimeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
