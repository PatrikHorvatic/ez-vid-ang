import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaMute } from './mute';

describe('EvaMute', () => {
  let component: EvaMute;
  let fixture: ComponentFixture<EvaMute>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaMute]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaMute);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
