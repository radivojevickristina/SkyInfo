import { TestBed } from '@angular/core/testing';

import { TravelBuddyService } from './travel-buddy-service';

describe('TravelBuddyService', () => {
  let service: TravelBuddyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TravelBuddyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
