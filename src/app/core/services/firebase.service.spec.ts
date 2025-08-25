import { TestBed } from '@angular/core/testing';

import { FirebasesevicesService } from './firebasesevices.service';

describe('FirebasesevicesService', () => {
  let service: FirebasesevicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirebasesevicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

