import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Volume } from './volume';

describe('Volume', () => {
  let component: Volume;
  let fixture: ComponentFixture<Volume>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Volume]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Volume);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
