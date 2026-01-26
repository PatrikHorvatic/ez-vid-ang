import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QualitySelector } from './quality-selector';

describe('QualitySelector', () => {
  let component: QualitySelector;
  let fixture: ComponentFixture<QualitySelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QualitySelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QualitySelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
