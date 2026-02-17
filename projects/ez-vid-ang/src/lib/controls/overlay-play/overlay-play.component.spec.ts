import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayPlayComponent } from './overlay-play.component';

describe('OverlayPlayComponent', () => {
  let component: OverlayPlayComponent;
  let fixture: ComponentFixture<OverlayPlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OverlayPlayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverlayPlayComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
