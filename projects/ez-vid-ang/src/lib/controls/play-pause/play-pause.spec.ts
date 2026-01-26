import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayPause } from './play-pause';

describe('PlayPause', () => {
  let component: PlayPause;
  let fixture: ComponentFixture<PlayPause>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayPause]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayPause);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
