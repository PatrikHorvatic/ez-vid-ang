import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaScrubBar } from './scrub-bar';

describe('EvaScrubBar', () => {
  let component: EvaScrubBar;
  let fixture: ComponentFixture<EvaScrubBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaScrubBar]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaScrubBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
