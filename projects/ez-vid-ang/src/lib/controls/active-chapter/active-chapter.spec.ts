import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EvaActiveChapter } from './active-chapter';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('ActiveChapterComponent', () => {
  let component: EvaActiveChapter;
  let fixture: ComponentFixture<EvaActiveChapter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaActiveChapter], providers: [EvaApi, EvaFullscreenAPI]
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
