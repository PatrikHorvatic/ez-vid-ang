import { TestBed } from '@angular/core/testing';
import { EvaFullscreenAPI } from './fullscreen';
import { EvaApi } from './eva-api';

describe('Fullscreen', () => {
  let service: EvaFullscreenAPI;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EvaFullscreenAPI, EvaApi] });
    service = TestBed.inject(EvaFullscreenAPI);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
