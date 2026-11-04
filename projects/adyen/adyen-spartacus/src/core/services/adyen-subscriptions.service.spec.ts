import { TestBed } from '@angular/core/testing';
import { UserIdService } from '@spartacus/core';
import { of } from 'rxjs';
import { AdyenSubscriptionsService } from './adyen-subscriptions.service';
import { AdyenSubscriptionsConnector } from '../connectors/adyen-subscriptions.connector';

describe('AdyenSubscriptionsService', () => {
  let service: AdyenSubscriptionsService;
  let connector: jasmine.SpyObj<AdyenSubscriptionsConnector>;
  let userId$: any;

  beforeEach(() => {
    connector = jasmine.createSpyObj('AdyenSubscriptionsConnector',
      ['getSubscriptions', 'cancelSubscription', 'changePaymentMethod', 'getEnrollmentUrl']);
    userId$ = of('current');
    TestBed.configureTestingModule({
      providers: [
        AdyenSubscriptionsService,
        { provide: AdyenSubscriptionsConnector, useValue: connector },
        { provide: UserIdService, useValue: { takeUserId: () => userId$ } }
      ]
    });
    service = TestBed.inject(AdyenSubscriptionsService);
  });

  it('loads the overview for the current user', (done) => {
    connector.getSubscriptions.and.returnValue(of({ sections: [] }));
    service.getSubscriptions().subscribe((r) => {
      expect(connector.getSubscriptions).toHaveBeenCalledWith('current');
      expect(r).toEqual({ sections: [] });
      done();
    });
  });

  it('cancels by code and platform', (done) => {
    connector.cancelSubscription.and.returnValue(of({}));
    service.cancelSubscription('S-1', 'RECURLY').subscribe(() => {
      expect(connector.cancelSubscription).toHaveBeenCalledWith('current', 'S-1', 'RECURLY');
      done();
    });
  });

  it('builds the change body from its arguments', (done) => {
    connector.changePaymentMethod.and.returnValue(of({ result: 'FAILED', moved: 0, failed: 1, partial: false }));
    service.changePaymentMethod('S-1', 'RECURLY', 'pm1', true).subscribe(() => {
      expect(connector.changePaymentMethod).toHaveBeenCalledWith('current', 'S-1',
        { platform: 'RECURLY', storedPaymentMethodId: 'pm1', applyToAll: true });
      done();
    });
  });

  it('requests the enrollment url by code and platform', (done) => {
    connector.getEnrollmentUrl.and.returnValue(of({ url: 'u' }));
    service.getEnrollmentUrl('S-1', 'RECURLY').subscribe(() => {
      expect(connector.getEnrollmentUrl).toHaveBeenCalledWith('current', 'S-1', 'RECURLY');
      done();
    });
  });

  it('refuses an anonymous user without calling the backend', (done) => {
    userId$ = of('anonymous');
    service.getSubscriptions().subscribe({
      error: () => {
        expect(connector.getSubscriptions).not.toHaveBeenCalled();
        done();
      }
    });
  });
});
