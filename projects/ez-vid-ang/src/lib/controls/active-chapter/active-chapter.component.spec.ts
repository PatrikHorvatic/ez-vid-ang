import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveChapterComponent } from './active-chapter.component';

describe('ActiveChapterComponent', () => {
  let component: ActiveChapterComponent;
  let fixture: ComponentFixture<ActiveChapterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ActiveChapterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActiveChapterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
