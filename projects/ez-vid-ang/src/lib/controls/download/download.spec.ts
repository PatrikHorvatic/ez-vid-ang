import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EvaDownload } from './download';
import { EvaApi } from '../../api/eva-api';
import { EvaFullscreenAPI } from '../../api/fullscreen';

describe('EvaDownload', () => {
  let component: EvaDownload;
  let fixture: ComponentFixture<EvaDownload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaDownload],
      providers: [EvaApi, EvaFullscreenAPI]
    }).compileComponents();

    fixture = TestBed.createComponent(EvaDownload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
