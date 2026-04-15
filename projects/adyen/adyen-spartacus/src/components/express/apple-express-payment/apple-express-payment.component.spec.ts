import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppleExpressPaymentComponent } from './apple-express-payment.component';
import { CheckoutAdyenConfigurationService } from '../../service/checkout-adyen-configuration.service';
import { AdyenExpressOrderService } from '../../service/adyen-express-order.service';
import { RoutingService,   QueryState } from '@spartacus/core';
import { AdyenConfigData } from '../../core/models/occ.config.models';

describe('AppleExpressPaymentComponent', () => {
  let component: AppleExpressPaymentComponent;
  let fixture: ComponentFixture<AppleExpressPaymentComponent>;
  let mockCheckoutAdyenConfigurationService: jasmine.SpyObj<CheckoutAdyenConfigurationService>;
  let mockAdyenExpressOrderService: jasmine.SpyObj<AdyenExpressOrderService>;
  let mockRoutingService: jasmine.SpyObj<RoutingService>;

  const mockAdyenConfigData: AdyenConfigData = {
    amountDecimal: 12.99,
    paymentMethods: [],
    connectedTerminalList: [],
    storedPaymentMethodList: [],
    issuerLists: new Map<string, string>(),
    creditCardLabel: 'Credit Card',
    allowedCards: [],
    amount: { value: 1000, currency: 'USD' },
    adyenClientKey: 'mockClientKey',
    adyenPaypalMerchantId: 'mockPaypalMerchantId',
    deviceFingerPrintUrl: 'mockDeviceFingerPrintUrl',
    selectedPaymentMethod: 'mockPaymentMethod',
    showRememberTheseDetails: true,
    checkoutShopperHost: 'mockShopperHost',
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

  beforeEach(async () => {
    mockCheckoutAdyenConfigurationService = jasmine.createSpyObj('CheckoutAdyenConfigurationService', ['getCheckoutConfigurationState']);
    mockAdyenExpressOrderService = jasmine.createSpyObj('AdyenExpressOrderService', ['adyenPlaceOrder']);
    mockRoutingService = jasmine.createSpyObj('RoutingService', ['go']);

    mockCheckoutAdyenConfigurationService = jasmine.createSpyObj('CheckoutAdyenConfigurationService', ['getCheckoutConfigurationState']);
    mockCheckoutAdyenConfigurationService.getCheckoutConfigurationState.and.returnValue(
      of({ loading: false, error: false, data: mockAdyenConfigData } as QueryState<AdyenConfigData>)
    );

    await TestBed.configureTestingModule({
      imports: [AppleExpressPaymentComponent],
      providers: [
        { provide: CheckoutAdyenConfigurationService, useValue: mockCheckoutAdyenConfigurationService },
        { provide: AdyenExpressOrderService, useValue: mockAdyenExpressOrderService },
        { provide: RoutingService, useValue: mockRoutingService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppleExpressPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
