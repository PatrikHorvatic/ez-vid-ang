import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvaScrubBarCurrentTimeComponent } from './scrub-bar-current-time.component';

describe('ScrubBarCurrentTimeComponent', () => {
  let component: EvaScrubBarCurrentTimeComponent;
  let fixture: ComponentFixture<EvaScrubBarCurrentTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaScrubBarCurrentTimeComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaScrubBarCurrentTimeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
