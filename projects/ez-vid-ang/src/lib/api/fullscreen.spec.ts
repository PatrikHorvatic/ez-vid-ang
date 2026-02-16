import { TestBed } from '@angular/core/testing';

import { Fullscreen } from './fullscreen';

describe('Fullscreen', () => {
  let service: Fullscreen;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Fullscreen);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
