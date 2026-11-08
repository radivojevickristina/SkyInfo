import { TestBed } from '@angular/core/testing';

import { AeroDataBoxService } from './aero-data-box-service';

describe('AeroDataBoxService', () => {
  let service: AeroDataBoxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AeroDataBoxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
