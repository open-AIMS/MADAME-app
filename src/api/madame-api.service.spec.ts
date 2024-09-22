import { TestBed } from '@angular/core/testing';

import { MadameApiService } from './madame-api.service';

describe('MadameApiService', () => {
  let service: MadameApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MadameApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
