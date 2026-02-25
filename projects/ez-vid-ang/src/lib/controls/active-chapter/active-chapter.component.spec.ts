import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvaActiveChapter } from './active-chapter.component';

describe('ActiveChapterComponent', () => {
  let component: EvaActiveChapter;
  let fixture: ComponentFixture<EvaActiveChapter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EvaActiveChapter]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EvaActiveChapter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
