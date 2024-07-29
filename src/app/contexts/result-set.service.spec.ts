import { TestBed } from '@angular/core/testing';

import { ResultSetService } from './result-set.service';

describe('ResultSetService', () => {
  let service: ResultSetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResultSetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
