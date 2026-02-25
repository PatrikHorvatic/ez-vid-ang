import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvaBackward } from './backward';

describe('BackwardComponent', () => {
  let component: EvaBackward;
  let fixture: ComponentFixture<EvaBackward>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaBackward]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaBackward);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
