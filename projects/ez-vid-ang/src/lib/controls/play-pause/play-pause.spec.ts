import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaPlayPause } from './play-pause';

describe('EvaPlayPause', () => {
  let component: EvaPlayPause;
  let fixture: ComponentFixture<EvaPlayPause>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaPlayPause]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaPlayPause);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
