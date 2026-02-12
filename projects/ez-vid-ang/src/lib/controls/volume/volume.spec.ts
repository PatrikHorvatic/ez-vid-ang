import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaVolume } from './volume';

describe('Volume', () => {
  let component: EvaVolume;
  let fixture: ComponentFixture<EvaVolume>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaVolume]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaVolume);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
