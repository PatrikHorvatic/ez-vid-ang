import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaFullscreen } from './fullscreen';

describe('EvaFullscreen', () => {
  let component: EvaFullscreen;
  let fixture: ComponentFixture<EvaFullscreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaFullscreen]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaFullscreen);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
