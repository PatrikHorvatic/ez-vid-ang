import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForwardComponent } from './forward.component';

describe('ForwardComponent', () => {
  let component: ForwardComponent;
  let fixture: ComponentFixture<ForwardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ForwardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForwardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
