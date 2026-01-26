import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EzVidAng } from './ez-vid-ang';

describe('EzVidAng', () => {
  let component: EzVidAng;
  let fixture: ComponentFixture<EzVidAng>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EzVidAng]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EzVidAng);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
