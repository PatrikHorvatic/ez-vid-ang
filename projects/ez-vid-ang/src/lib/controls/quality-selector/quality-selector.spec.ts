import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaQualitySelector } from './quality-selector';

describe('EvaQualitySelector', () => {
  let component: EvaQualitySelector;
  let fixture: ComponentFixture<EvaQualitySelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaQualitySelector]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaQualitySelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
