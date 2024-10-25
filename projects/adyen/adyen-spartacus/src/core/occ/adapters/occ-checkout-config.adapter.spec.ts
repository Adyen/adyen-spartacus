import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OccCheckoutConfigAdapter } from './occ-checkout-config.adapter';
import { OccEndpointsService } from '@spartacus/core';
import { AdyenConfigData } from '../../models/occ.config.models';

describe('OccCheckoutConfigAdapter', () => {
  let adapter: OccCheckoutConfigAdapter;
  let httpMock: HttpTestingController;
  let occEndpointsService: jasmine.SpyObj<OccEndpointsService>;

  beforeEach(() => {
    const occEndpointsServiceSpy = jasmine.createSpyObj('OccEndpointsService', ['buildUrl']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OccCheckoutConfigAdapter,
        { provide: OccEndpointsService, useValue: occEndpointsServiceSpy }
      ]
    });

    adapter = TestBed.inject(OccCheckoutConfigAdapter);
    httpMock = TestBed.inject(HttpTestingController);
    occEndpointsService = TestBed.inject(OccEndpointsService) as jasmine.SpyObj<OccEndpointsService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  it('should call getCheckoutConfiguration and return AdyenConfigData', () => {
    const userId = 'testUser';
    const cartId = 'testCart';
    const mockResponse: AdyenConfigData = {
      paymentMethods: [],
      connectedTerminalList: [],
      storedPaymentMethodList: [],
      issuerLists: new Map<string, string>(),
      creditCardLabel: 'Mock Credit Card Label',
      allowedCards: [],
      amount: {
        value: 1000,
        currency: 'USD'
      },
      adyenClientKey: 'mockClientKey',
      adyenPaypalMerchantId: 'mockPaypalMerchantId',
      deviceFingerPrintUrl: 'https://mock.device.fingerprint.url',
      sessionData: {
        id: 'mockSessionId',
        sessionData: 'mockSessionData'
      },
      selectedPaymentMethod: 'mockPaymentMethod',
      showRememberTheseDetails: true,
      checkoutShopperHost: 'https://mock.checkout.shopper.host',
      environmentMode: 'test',
      shopperLocale: 'en-US',
      openInvoiceMethods: [],
      showSocialSecurityNumber: false,
      showBoleto: false,
      showComboCard: false,
      showPos: false,
      immediateCapture: false,
      countryCode: 'US',
      cardHolderNameRequired: true,
      sepaDirectDebit: false
    };

    occEndpointsService.buildUrl.and.returnValue(`users/${userId}/carts/${cartId}/adyen/checkout-configuration`);

    adapter.getCheckoutConfiguration(userId, cartId).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`users/${userId}/carts/${cartId}/adyen/checkout-configuration`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
