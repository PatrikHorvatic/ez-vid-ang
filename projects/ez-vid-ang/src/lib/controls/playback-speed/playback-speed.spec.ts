import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaybackSpeed } from './playback-speed';

describe('PlaybackSpeed', () => {
  let component: PlaybackSpeed;
  let fixture: ComponentFixture<PlaybackSpeed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaybackSpeed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaybackSpeed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
