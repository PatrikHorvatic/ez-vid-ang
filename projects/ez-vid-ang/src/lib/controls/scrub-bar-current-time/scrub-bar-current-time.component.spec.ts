import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrubBarCurrentTimeComponent } from './scrub-bar-current-time.component';

describe('ScrubBarCurrentTimeComponent', () => {
  let component: ScrubBarCurrentTimeComponent;
  let fixture: ComponentFixture<ScrubBarCurrentTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScrubBarCurrentTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScrubBarCurrentTimeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
