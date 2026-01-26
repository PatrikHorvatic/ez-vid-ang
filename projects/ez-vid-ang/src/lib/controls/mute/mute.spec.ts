import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mute } from './mute';

describe('Mute', () => {
  let component: Mute;
  let fixture: ComponentFixture<Mute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mute]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
