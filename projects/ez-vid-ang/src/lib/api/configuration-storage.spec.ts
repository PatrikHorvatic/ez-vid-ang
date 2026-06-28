import { TestBed } from '@angular/core/testing';
import { EvaConfigurationStorage } from './configuration-storage';

describe('EvaConfigurationStorage', () => {
  let service: EvaConfigurationStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EvaConfigurationStorage] });
    service = TestBed.inject(EvaConfigurationStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
