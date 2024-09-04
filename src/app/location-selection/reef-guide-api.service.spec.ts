import { TestBed } from '@angular/core/testing';

import { ReefGuideApiService } from './reef-guide-api.service';

describe('SelectionApiService', () => {
  let service: ReefGuideApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReefGuideApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
