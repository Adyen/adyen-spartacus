import { TestBed } from '@angular/core/testing';

import { OccCheckoutConfigAdapter } from './occ-checkout-config.adapter';

describe('CheckoutConfigServiceService', () => {
  let service: OccCheckoutConfigAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OccCheckoutConfigAdapter);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
