import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CheckoutAdyenConfigurationService } from './checkout-adyen-configuration.service';
import { UserIdService, QueryService, LoginEvent, LogoutEvent, QueryState } from '@spartacus/core';
import { CheckoutConfigurationConnector } from '../core/connectors/checkout-configuration.connector';
import { CheckoutAdyenConfigurationReloadEvent } from '../events/checkout-adyen.events';
import { AdyenConfigData } from '../core/models/occ.config.models';
import { ActiveCartFacade } from '@spartacus/cart/base/root';

describe('CheckoutAdyenConfigurationService', () => {
  let service: CheckoutAdyenConfigurationService;
  let userIdService: jasmine.SpyObj<UserIdService>;
  let queryService: jasmine.SpyObj<QueryService>;
  let activeCartFacade: jasmine.SpyObj<ActiveCartFacade>;
  let checkoutConfigurationConnector: jasmine.SpyObj<CheckoutConfigurationConnector>;

  beforeEach(() => {
    const userIdServiceSpy = jasmine.createSpyObj('UserIdService', ['takeUserId']);
    const queryServiceSpy = jasmine.createSpyObj('QueryService', ['create']);
    const activeCartFacadeSpy = jasmine.createSpyObj('ActiveCartFacade', ['getActiveCartId']);
    const checkoutConfigurationConnectorSpy = jasmine.createSpyObj('CheckoutConfigurationConnector', ['getCheckoutConfiguration']);

    TestBed.configureTestingModule({
      providers: [
        CheckoutAdyenConfigurationService,
        { provide: UserIdService, useValue: userIdServiceSpy },
        { provide: QueryService, useValue: queryServiceSpy },
        { provide: ActiveCartFacade, useValue: activeCartFacadeSpy },
        { provide: CheckoutConfigurationConnector, useValue: checkoutConfigurationConnectorSpy }
      ]
    });

    service = TestBed.inject(CheckoutAdyenConfigurationService);
    userIdService = TestBed.inject(UserIdService) as jasmine.SpyObj<UserIdService>;
    queryService = TestBed.inject(QueryService) as jasmine.SpyObj<QueryService>;
    activeCartFacade = TestBed.inject(ActiveCartFacade) as jasmine.SpyObj<ActiveCartFacade>;
    checkoutConfigurationConnector = TestBed.inject(CheckoutConfigurationConnector) as jasmine.SpyObj<CheckoutConfigurationConnector>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

/*  it('should get checkout configuration state', () => {
    const mockState: QueryState<AdyenConfigData> = { loading: false, error: false, data: {} as AdyenConfigData };
    queryService.create.and.returnValue({
      getState: () => of(mockState)
    });

    service.getCheckoutConfigurationState().subscribe((state) => {
      expect(state).toEqual(mockState);
    });

    expect(queryService.create).toHaveBeenCalled();
  });*/

  it('should fetch checkout configuration', (done: DoneFn) => {
    const mockUserId = 'testUser';
    const mockCartId = 'testCart';
    const mockConfigData: AdyenConfigData = {
      paymentMethods: [],
      connectedTerminalList: ['terminal1', 'terminal2'],
      storedPaymentMethodList: [],
      issuerLists: new Map<string, string>([['issuer1', 'Issuer 1']]),
      creditCardLabel: 'Credit Card',
      allowedCards: [{ code: 'visa', type: 'Visa' }],
      amount: { value: 1000, currency: 'USD' },
      adyenClientKey: 'testClientKey',
      adyenPaypalMerchantId: 'testPaypalMerchantId',
      deviceFingerPrintUrl: 'https://example.com/fingerprint',
      sessionData: { id: 'sessionId', sessionData: 'sessionData' },
      selectedPaymentMethod: 'visa',
      showRememberTheseDetails: true,
      checkoutShopperHost: 'https://example.com/shopper',
      environmentMode: 'test',
      shopperLocale: 'en-US',
      openInvoiceMethods: ['invoice'],
      showSocialSecurityNumber: false,
      showBoleto: false,
      showComboCard: false,
      showPos: true,
      immediateCapture: false,
      countryCode: 'US',
      cardHolderNameRequired: true,
      sepaDirectDebit: false,
      amountDecimal: 1000
    };

    checkoutConfigurationConnector.getCheckoutConfiguration.and.returnValue(of(mockConfigData));

    service.fetchCheckoutConfiguration(mockUserId, mockCartId).subscribe((configData) => {
      expect(configData).toEqual(mockConfigData);
      done();
    });

    expect(checkoutConfigurationConnector.getCheckoutConfiguration).toHaveBeenCalledWith(mockUserId, mockCartId);
  });

  it('should reload on specific events', () => {
    const reloadEvents = service['getCheckoutAdyenConfigurationLoadedEvents']();
    expect(reloadEvents).toContain(CheckoutAdyenConfigurationReloadEvent);
    expect(reloadEvents).toContain(LoginEvent);
    expect(reloadEvents).toContain(LogoutEvent);
  });
});
