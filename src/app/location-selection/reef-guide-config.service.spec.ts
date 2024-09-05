import { TestBed } from '@angular/core/testing';

import { ReefGuideConfigService } from './reef-guide-config.service';

describe('ReefGuideConfigService', () => {
  let service: ReefGuideConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReefGuideConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
