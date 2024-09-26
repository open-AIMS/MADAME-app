import { TestBed } from '@angular/core/testing';

import { WebApiService } from './web-api.service';

describe('MadameApiService', () => {
  let service: WebApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
