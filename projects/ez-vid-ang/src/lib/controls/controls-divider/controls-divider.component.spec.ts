import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvaControlsDivider } from './controls-divider.component';

describe('ControlsDividerComponent', () => {
  let component: EvaControlsDivider;
  let fixture: ComponentFixture<EvaControlsDivider>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaControlsDivider]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaControlsDivider);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
