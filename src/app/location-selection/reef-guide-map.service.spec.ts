import { TestBed } from '@angular/core/testing';

import { ReefGuideMapService } from './reef-guide-map.service';

describe('ReefGuideMapService', () => {
  let service: ReefGuideMapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReefGuideMapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
