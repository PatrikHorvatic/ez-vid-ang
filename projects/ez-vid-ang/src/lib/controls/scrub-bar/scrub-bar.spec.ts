import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrubBar } from './scrub-bar';

describe('ScrubBar', () => {
  let component: ScrubBar;
  let fixture: ComponentFixture<ScrubBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrubBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScrubBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
