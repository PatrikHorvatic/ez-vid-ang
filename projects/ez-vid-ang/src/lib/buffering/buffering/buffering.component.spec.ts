import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvaBuffering } from './buffering.component';

describe('BufferingComponent', () => {
  let component: EvaBuffering;
  let fixture: ComponentFixture<EvaBuffering>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaBuffering]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaBuffering);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
