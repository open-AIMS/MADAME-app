import { TestBed } from '@angular/core/testing';

import { AdriaApiService } from './adria-api.service';

describe('AdriaApiService', () => {
  let service: AdriaApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdriaApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
