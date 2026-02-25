import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaOverlayPlay } from './overlay-play';

describe('OverlayPlayComponent', () => {
  let component: EvaOverlayPlay;
  let fixture: ComponentFixture<EvaOverlayPlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaOverlayPlay]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaOverlayPlay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
