import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrubBarBufferingTimeComponent } from './scrub-bar-buffering-time.component';

describe('ScrubBarBufferingTimeComponent', () => {
  let component: ScrubBarBufferingTimeComponent;
  let fixture: ComponentFixture<ScrubBarBufferingTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScrubBarBufferingTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScrubBarBufferingTimeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
