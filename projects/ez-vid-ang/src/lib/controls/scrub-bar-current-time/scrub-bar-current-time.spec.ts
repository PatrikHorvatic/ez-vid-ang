import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvaScrubBarCurrentTime } from './scrub-bar-current-time';

describe('ScrubBarCurrentTimeComponent', () => {
  let component: EvaScrubBarCurrentTime;
  let fixture: ComponentFixture<EvaScrubBarCurrentTime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaScrubBarCurrentTime]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaScrubBarCurrentTime);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
