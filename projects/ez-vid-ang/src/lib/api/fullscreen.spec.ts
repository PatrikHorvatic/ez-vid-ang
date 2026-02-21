import { TestBed } from '@angular/core/testing';
import { EvaFullscreenAPI } from './fullscreen';

describe('Fullscreen', () => {
  let service: EvaFullscreenAPI;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EvaFullscreenAPI);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
