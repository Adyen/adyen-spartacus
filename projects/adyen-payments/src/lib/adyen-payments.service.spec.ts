import { TestBed } from '@angular/core/testing';

import { AdyenPaymentsService } from './adyen-payments.service';

describe('AdyenPaymentsService', () => {
  let service: AdyenPaymentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdyenPaymentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
