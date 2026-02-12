import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaPlaybackSpeed } from './playback-speed';

describe('EvaPlaybackSpeed', () => {
  let component: EvaPlaybackSpeed;
  let fixture: ComponentFixture<EvaPlaybackSpeed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaPlaybackSpeed]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaPlaybackSpeed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
