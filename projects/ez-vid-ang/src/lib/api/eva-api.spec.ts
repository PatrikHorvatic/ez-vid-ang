import { TestBed } from '@angular/core/testing';

import { EvaApi } from './eva-api';

describe('EvaApi', () => {
  let service: EvaApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EvaApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
