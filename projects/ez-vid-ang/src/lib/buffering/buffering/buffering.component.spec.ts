import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvaBufferingComponent } from './buffering.component';

describe('BufferingComponent', () => {
  let component: EvaBufferingComponent;
  let fixture: ComponentFixture<EvaBufferingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaBufferingComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaBufferingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
