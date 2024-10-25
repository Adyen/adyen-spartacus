import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdyenOrderService } from './adyen-order.service';
import { UserIdService, CommandService, GlobalMessageService, GlobalMessageType, TranslationService, EventService, Address } from '@spartacus/core';
import { OrderConnector, OrderHistoryConnector } from '@spartacus/order/core';
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { AdyenOrderConnector } from '../core/connectors/adyen-order-connector.service';
import { AdditionalDetailsConnector } from '../core/connectors/additional-details.connector';
import { HttpErrorResponse } from '@angular/common/http';

describe('AdyenOrderService', () => {
  let service: AdyenOrderService;
  let userIdService: jasmine.SpyObj<UserIdService>;
  let commandService: jasmine.SpyObj<CommandService>;
  let globalMessageService: jasmine.SpyObj<GlobalMessageService>;
  let translationService: jasmine.SpyObj<TranslationService>;
  let eventService: jasmine.SpyObj<EventService>;
  let orderConnector: jasmine.SpyObj<OrderConnector>;
  let orderHistoryConnector: jasmine.SpyObj<OrderHistoryConnector>;
  let activeCartFacade: jasmine.SpyObj<ActiveCartFacade>;
  let placeOrderConnector: jasmine.SpyObj<AdyenOrderConnector>;
  let additionalDetailsConnector: jasmine.SpyObj<AdditionalDetailsConnector>;

  beforeEach(() => {
    const userIdServiceSpy = jasmine.createSpyObj('UserIdService', ['takeUserId']);
    const commandServiceSpy = jasmine.createSpyObj('CommandService', ['create']);
    const globalMessageServiceSpy = jasmine.createSpyObj('GlobalMessageService', ['add']);
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['dispatch']);
    const orderConnectorSpy = jasmine.createSpyObj('OrderConnector', ['']);
    const orderHistoryConnectorSpy = jasmine.createSpyObj('OrderHistoryConnector', ['get']);
    const activeCartFacadeSpy = jasmine.createSpyObj('ActiveCartFacade', ['takeActiveCartId', 'isGuestCart']);
    const placeOrderConnectorSpy = jasmine.createSpyObj('AdyenOrderConnector', ['placeOrder', 'paymentCanceled']);
    const additionalDetailsConnectorSpy = jasmine.createSpyObj('AdditionalDetailsConnector', ['sendAdditionalDetails']);

    TestBed.configureTestingModule({
      providers: [
        AdyenOrderService,
        { provide: UserIdService, useValue: userIdServiceSpy },
        { provide: CommandService, useValue: commandServiceSpy },
        { provide: GlobalMessageService, useValue: globalMessageServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy },
        { provide: EventService, useValue: eventServiceSpy },
        { provide: OrderConnector, useValue: orderConnectorSpy },
        { provide: OrderHistoryConnector, useValue: orderHistoryConnectorSpy },
        { provide: ActiveCartFacade, useValue: activeCartFacadeSpy },
        { provide: AdyenOrderConnector, useValue: placeOrderConnectorSpy },
        { provide: AdditionalDetailsConnector, useValue: additionalDetailsConnectorSpy }
      ]
    });

    service = TestBed.inject(AdyenOrderService);
    userIdService = TestBed.inject(UserIdService) as jasmine.SpyObj<UserIdService>;
    commandService = TestBed.inject(CommandService) as jasmine.SpyObj<CommandService>;
    globalMessageService = TestBed.inject(GlobalMessageService) as jasmine.SpyObj<GlobalMessageService>;
    translationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    orderConnector = TestBed.inject(OrderConnector) as jasmine.SpyObj<OrderConnector>;
    orderHistoryConnector = TestBed.inject(OrderHistoryConnector) as jasmine.SpyObj<OrderHistoryConnector>;
    activeCartFacade = TestBed.inject(ActiveCartFacade) as jasmine.SpyObj<ActiveCartFacade>;
    placeOrderConnector = TestBed.inject(AdyenOrderConnector) as jasmine.SpyObj<AdyenOrderConnector>;
    additionalDetailsConnector = TestBed.inject(AdditionalDetailsConnector) as jasmine.SpyObj<AdditionalDetailsConnector>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should place order successfully', (done: DoneFn) => {
    const mockUserId = 'testUser';
    const mockCartId = 'testCart';
    const mockPaymentData = {};
    const mockBillingAddress = { id: 'testAddress' } as Address;
    const mockResponse = { orderData: {}, orderNumber: '12345', success: true };

    userIdService.takeUserId.and.returnValue(of(mockUserId));
    activeCartFacade.takeActiveCartId.and.returnValue(of(mockCartId));
    activeCartFacade.isGuestCart.and.returnValue(of(false));
    placeOrderConnector.placeOrder.and.returnValue(of(mockResponse));

    service.adyenPlaceOrder(mockPaymentData, mockBillingAddress).subscribe((response) => {
      expect(response).toEqual(mockResponse);
      expect(eventService.dispatch).toHaveBeenCalled();
      done();
    });
  });

  it('should handle place order error', (done: DoneFn) => {
    const mockUserId = 'testUser';
    const mockCartId = 'testCart';
    const mockPaymentData = {};
    const mockBillingAddress = { id: 'testAddress' } as Address;
    const mockError = new HttpErrorResponse({ error: { errorCode: 'ERROR_CODE', invalidFields: [] } });

    userIdService.takeUserId.and.returnValue(of(mockUserId));
    activeCartFacade.takeActiveCartId.and.returnValue(of(mockCartId));
    activeCartFacade.isGuestCart.and.returnValue(of(false));
    placeOrderConnector.placeOrder.and.returnValue(throwError(mockError));
    translationService.translate.and.returnValue(of('Translated error message'));

    service.adyenPlaceOrder(mockPaymentData, mockBillingAddress).subscribe((response) => {
      expect(response.success).toBeFalse();
      expect(globalMessageService.add).toHaveBeenCalledWith('Translated error message', GlobalMessageType.MSG_TYPE_ERROR, 20000);
      done();
    });
  });
});
