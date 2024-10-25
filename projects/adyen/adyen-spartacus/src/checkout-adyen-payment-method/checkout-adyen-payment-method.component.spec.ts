import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CheckoutAdyenPaymentMethodComponent } from './checkout-adyen-payment-method.component';
import { ActivatedRoute } from '@angular/router';
import { ActiveCartFacade, CartType, MultiCartFacade } from '@spartacus/cart/base/root';
import { CheckoutDeliveryAddressFacade } from '@spartacus/checkout/base/root';
import {
  EventService,
  GlobalMessageService,
  RoutingService,
  UserIdService,
  UserPaymentService,
  I18nModule,
  TranslationService,
  UserAddressService,
  UserAddressConnector,
  UserAddressAdapter,
  QueryState,
} from '@spartacus/core';
import { CheckoutStepService } from '@spartacus/checkout/base/components';
import { CheckoutAdyenConfigurationService } from '../service/checkout-adyen-configuration.service';
import { AdyenOrderService } from '../service/adyen-order.service';
import { CheckoutAdyenConfigurationReloadEvent } from '../events/checkout-adyen.events';
import { Store, StoreModule } from '@ngrx/store';
import { AdyenAddressService } from '../service/adyen-address.service';
import { map } from 'rxjs/operators';
import { AdyenConfigData } from '../core/models/occ.config.models';
import { Pipe, PipeTransform } from '@angular/core';
import { Component } from '@angular/core';

@Pipe({ name: 'cxTranslate' })
class MockCxTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value; // or return a mock translation
  }
}


@Component({
  selector: 'cx-adyen-delivery-address',
  template: ''
})
class MockAdyenCheckoutDeliveryAddressComponent {}


describe('CheckoutAdyenPaymentMethodComponent', () => {
  let component: CheckoutAdyenPaymentMethodComponent;
  let fixture: ComponentFixture<CheckoutAdyenPaymentMethodComponent>;
  let mockActivatedRoute: any;
  let mockActiveCartFacade: any;
  let mockCheckoutDeliveryAddressFacade: any;
  let mockRoutingService: any;
  let mockUserPaymentService: any;
  let mockCheckoutStepService: any;
  let mockCheckoutAdyenConfigurationService: any;
  let mockAdyenOrderService: any;
  let mockEventService: any;
  let mockUserIdService: any;
  let mockMultiCartFacade: any;
  let mockTranslationService: any;
  let mockStore: any;
  let mockUserAddressAdapter: any;
  let mockAdyenAddressService: any;
  let mockTranslateService: any;


  const mockAdyenConfigData: AdyenConfigData = {
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
    sessionData: { id: 'mockSessionId', sessionData: 'mockSessionData' },
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

  const mockStateData = {
    loading: false,
    error: false,
    data: {
      id: '1',
      title: 'Mr.',
      firstName: 'John',
      lastName: 'Doe',
      line1: '123 Main St',
      town: 'Anytown',
      postalCode: '12345',
      country: { isocode: 'US', name: 'United States' }
    }
  };

  beforeEach(async () => {
    mockActivatedRoute = { snapshot: { queryParamMap: { get: jasmine.createSpy().and.returnValue('sessionId') } } };
    mockActiveCartFacade = jasmine.createSpyObj('ActiveCartFacade', ['isGuestCart', 'getActiveCartId']);
    mockActiveCartFacade.isGuestCart.and.returnValue(of(false));
    mockCheckoutDeliveryAddressFacade = jasmine.createSpyObj('CheckoutDeliveryAddressFacade', ['getDeliveryAddressState']);
    mockCheckoutDeliveryAddressFacade.getDeliveryAddressState.and.returnValue(
      of(mockStateData).pipe(
        map(state => state) // Example operator, replace with actual operators if needed
      )
    );
    mockRoutingService = jasmine.createSpyObj('RoutingService', ['go']);
    mockUserPaymentService = jasmine.createSpyObj('UserPaymentService', ['loadPaymentMethods']);
    mockCheckoutStepService = jasmine.createSpyObj('CheckoutStepService', ['next', 'back']);
    mockCheckoutAdyenConfigurationService = jasmine.createSpyObj('CheckoutAdyenConfigurationService', ['getCheckoutConfigurationState']);
    mockCheckoutAdyenConfigurationService.getCheckoutConfigurationState.and.returnValue(
      of({ loading: false, error: false, data: mockAdyenConfigData } as QueryState<AdyenConfigData>)
    );
    mockAdyenOrderService = jasmine.createSpyObj('AdyenOrderService', ['adyenPlaceOrder', 'sendAdditionalDetails', 'sendPaymentCancelled']);
    mockEventService = jasmine.createSpyObj('EventService', ['dispatch', 'get']);
    mockEventService.get.and.returnValue(of(new CheckoutAdyenConfigurationReloadEvent()));
    mockUserIdService = jasmine.createSpyObj('UserIdService', ['takeUserId']);
    mockUserIdService.takeUserId.and.returnValue(of('userId'));
    mockMultiCartFacade = jasmine.createSpyObj('MultiCartFacade', ['reloadCart', 'loadCart', 'getCartIdByType']);
    mockMultiCartFacade.getCartIdByType.and.returnValue(of('cartId'));
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockStore = jasmine.createSpyObj('Store', ['select', 'dispatch']);
    mockUserAddressAdapter = jasmine.createSpyObj('UserAddressAdapter', ['load']);
    mockAdyenAddressService = jasmine.createSpyObj('AdyenAddressService', ['someMethod']);
    mockTranslateService = jasmine.createSpyObj('TranslateService', ['get']);
    mockTranslateService.get.and.returnValue(of('translated text'));


    await TestBed.configureTestingModule({
      declarations: [CheckoutAdyenPaymentMethodComponent, MockCxTranslatePipe, MockAdyenCheckoutDeliveryAddressComponent],
      imports: [I18nModule, StoreModule.forRoot({})],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ActiveCartFacade, useValue: mockActiveCartFacade },
        { provide: CheckoutDeliveryAddressFacade, useValue: mockCheckoutDeliveryAddressFacade },
        { provide: RoutingService, useValue: mockRoutingService },
        { provide: UserPaymentService, useValue: mockUserPaymentService },
        { provide: CheckoutStepService, useValue: mockCheckoutStepService },
        { provide: CheckoutAdyenConfigurationService, useValue: mockCheckoutAdyenConfigurationService },
        { provide: AdyenOrderService, useValue: mockAdyenOrderService },
        { provide: EventService, useValue: mockEventService },
        { provide: UserIdService, useValue: mockUserIdService },
        { provide: MultiCartFacade, useValue: mockMultiCartFacade },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: Store, useValue: mockStore },
        { provide: UserAddressAdapter, useValue: mockUserAddressAdapter },
        { provide: AdyenAddressService, useValue: mockAdyenAddressService },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckoutAdyenPaymentMethodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load payment methods if not guest checkout', () => {
    component.ngOnInit();
    expect(mockUserPaymentService.loadPaymentMethods).toHaveBeenCalled();
  });

  it('should navigate to order confirmation on success', () => {
    component.onSuccess();
    expect(mockRoutingService.go).toHaveBeenCalledWith({ cxRoute: 'orderConfirmation' });
  });

  it('should unsubscribe from all subscriptions on destroy', () => {
    spyOn(component['subscriptions'], 'unsubscribe');
    component.ngOnDestroy();
    expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
  });
});
