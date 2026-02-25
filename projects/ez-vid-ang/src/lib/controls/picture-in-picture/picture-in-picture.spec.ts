import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaPictureInPicture } from './picture-in-picture';

describe('EvaPictureInPicture', () => {
  let component: EvaPictureInPicture;
  let fixture: ComponentFixture<EvaPictureInPicture>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaPictureInPicture]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaPictureInPicture);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
