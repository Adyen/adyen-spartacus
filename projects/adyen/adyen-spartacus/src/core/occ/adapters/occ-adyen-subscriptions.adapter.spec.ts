import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OccEndpointsService } from '@spartacus/core';
import { OccAdyenSubscriptionsAdapter } from './occ-adyen-subscriptions.adapter';

describe('OccAdyenSubscriptionsAdapter', () => {
  let adapter: OccAdyenSubscriptionsAdapter;
  let httpMock: HttpTestingController;
  let occ: jasmine.SpyObj<OccEndpointsService>;

  beforeEach(() => {
    occ = jasmine.createSpyObj('OccEndpointsService', ['buildUrl']);
    occ.buildUrl.and.callFake((endpoint: string, attrs?: any) => {
      let url = endpoint.replace(/\$\{(\w+)\}/g, (_m, k) => attrs?.urlParams?.[k]);
      const q = attrs?.queryParams;
      if (q) {
        url += '?' + Object.keys(q).map((k) => `${k}=${q[k]}`).join('&');
      }
      return 'occ/' + url;
    });
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OccAdyenSubscriptionsAdapter, { provide: OccEndpointsService, useValue: occ }]
    });
    adapter = TestBed.inject(OccAdyenSubscriptionsAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GETs the overview of the user', () => {
    let body: any;
    adapter.getSubscriptions('current').subscribe((r) => body = r);
    const req = httpMock.expectOne('occ/users/current/adyen/subscriptions');
    expect(req.request.method).toBe('GET');
    req.flush({ sections: [] });
    expect(body).toEqual({ sections: [] });
  });

  it('POSTs cancel with the platform as query parameter and an empty body', () => {
    adapter.cancelSubscription('current', 'S-1', 'RECURLY').subscribe();
    const req = httpMock.expectOne('occ/users/current/adyen/subscriptions/S-1/cancel?platform=RECURLY');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({});
  });

  it('POSTs the payment-method change with platform, method id and applyToAll in the body', () => {
    adapter.changePaymentMethod('current', 'S-1',
      { platform: 'RECURLY', storedPaymentMethodId: 'pm1', applyToAll: true }).subscribe();
    const req = httpMock.expectOne('occ/users/current/adyen/subscriptions/S-1/payment-method');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ platform: 'RECURLY', storedPaymentMethodId: 'pm1', applyToAll: true });
    req.flush({ result: 'CHANGED_THIS_SUBSCRIPTION', moved: 1, failed: 0, partial: false });
  });

  it('POSTs the enrollment request (never a GET) and returns the url', () => {
    let url: string | undefined;
    adapter.getEnrollmentUrl('current', 'S-1', 'RECURLY').subscribe((r) => url = r.url);
    const req = httpMock.expectOne('occ/users/current/adyen/subscriptions/S-1/payment-method/enrollment?platform=RECURLY');
    expect(req.request.method).toBe('POST');
    req.flush({ url: 'https://provider.example/hosted' });
    expect(url).toBe('https://provider.example/hosted');
  });
});
