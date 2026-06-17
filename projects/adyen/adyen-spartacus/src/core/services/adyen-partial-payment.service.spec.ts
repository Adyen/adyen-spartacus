import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  CommandService,
  EventService,
  GlobalMessageService,
  TranslationService,
  UserIdService
} from '@spartacus/core';
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { AdyenPartialPaymentService } from './adyen-partial-payment.service';
import { AdyenPartialPaymentConnector } from '../connectors/adyen-partial-payment.connector';
import {
  GiftCardBalanceRequest,
  GiftCardBalanceResponse,
  PartialPaymentOrderRequest,
  PartialPaymentOrderResponse
} from '../models/occ.order.models';

describe('AdyenPartialPaymentService', () => {
  let service: AdyenPartialPaymentService;
  let mockPartialPaymentConnector: jasmine.SpyObj<AdyenPartialPaymentConnector>;
  let mockActiveCartFacade: jasmine.SpyObj<ActiveCartFacade>;
  let mockUserIdService: jasmine.SpyObj<UserIdService>;
  let mockCommandService: jasmine.SpyObj<CommandService>;
  let mockEventService: jasmine.SpyObj<EventService>;
  let mockGlobalMessageService: jasmine.SpyObj<GlobalMessageService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    const partialPaymentConnectorSpy = jasmine.createSpyObj('AdyenPartialPaymentConnector', [
      'checkGiftCardBalance',
      'createPartialPaymentOrder'
    ]);
    const activeCartFacadeSpy = jasmine.createSpyObj('ActiveCartFacade', ['getActiveCartId']);
    const userIdServiceSpy = jasmine.createSpyObj('UserIdService', ['takeUserId']);
    const commandServiceSpy = jasmine.createSpyObj('CommandService', ['create']);
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['dispatch']);
    const globalMessageServiceSpy = jasmine.createSpyObj('GlobalMessageService', ['add']);
    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);

    TestBed.configureTestingModule({
      providers: [
        AdyenPartialPaymentService,
        { provide: AdyenPartialPaymentConnector, useValue: partialPaymentConnectorSpy },
        { provide: ActiveCartFacade, useValue: activeCartFacadeSpy },
        { provide: UserIdService, useValue: userIdServiceSpy },
        { provide: CommandService, useValue: commandServiceSpy },
        { provide: EventService, useValue: eventServiceSpy },
        { provide: GlobalMessageService, useValue: globalMessageServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy }
      ]
    });

    service = TestBed.inject(AdyenPartialPaymentService);
    mockPartialPaymentConnector = TestBed.inject(AdyenPartialPaymentConnector) as jasmine.SpyObj<AdyenPartialPaymentConnector>;
    mockActiveCartFacade = TestBed.inject(ActiveCartFacade) as jasmine.SpyObj<ActiveCartFacade>;
    mockUserIdService = TestBed.inject(UserIdService) as jasmine.SpyObj<UserIdService>;
    mockCommandService = TestBed.inject(CommandService) as jasmine.SpyObj<CommandService>;
    mockEventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    mockGlobalMessageService = TestBed.inject(GlobalMessageService) as jasmine.SpyObj<GlobalMessageService>;
    mockTranslationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPaymentState', () => {
    it('should return payment state observable', () => {
      service.getPaymentState().subscribe(state => {
        expect(state).toEqual({
          errorCode: '',
          errorFieldCodes: [],
          orderNumber: '',
          partialPaymentId: undefined,
          redirectToNextStep: false
        });
      });
    });
  });

  describe('handleBalanceCheck', () => {
    it('should handle successful balance check', () => {
      const mockData = {
        paymentMethod: {
          number: '1234567890123456',
          cvc: '123',
          brand: 'genericgiftcard',
          type: 'giftcard'
        },
        amount: { value: 1000, currency: 'EUR' }
      };

      const mockResponse: GiftCardBalanceResponse = {
        balance: { value: 5000, currency: 'EUR' },
        transactionLimit: { value: 1000, currency: 'EUR' },
        currentBalance: { value: 5000, currency: 'EUR' },
        partialPaymentId: 'test-partial-payment-id'
      };

      const mockCommand = {
        execute: jasmine.createSpy('execute').and.returnValue(of(mockResponse))
      };

      mockCommandService.create.and.returnValue(mockCommand as any);

      const resolveSpy = jasmine.createSpy('resolve');
      const rejectSpy = jasmine.createSpy('reject');

      service.handleBalanceCheck(resolveSpy, rejectSpy, mockData);

      expect(resolveSpy).toHaveBeenCalledWith({
        balance: mockResponse.balance,
        transactionLimit: mockResponse.transactionLimit,
        partialPaymentId: mockResponse.partialPaymentId,
        chargedAmount: mockResponse.chargedAmount,
        remainingAmount: mockResponse.remainingAmount
      });
    });

    it('should handle balance check error', () => {
      const mockData = {
        paymentMethod: {
          number: '1234567890123456',
          cvc: '123',
          brand: 'genericgiftcard',
          type: 'giftcard'
        },
        amount: { value: 1000, currency: 'EUR' }
      };

      const mockCommand = {
        execute: jasmine.createSpy('execute').and.returnValue(throwError('Balance check failed'))
      };

      mockCommandService.create.and.returnValue(mockCommand as any);

      const resolveSpy = jasmine.createSpy('resolve');
      const rejectSpy = jasmine.createSpy('reject');

      service.handleBalanceCheck(resolveSpy, rejectSpy, mockData);

      expect(rejectSpy).toHaveBeenCalled();
    });
  });

  describe('handleOrderRequest', () => {
    it('should handle successful order request', () => {
      const mockData = {
        amount: { value: 1000, currency: 'EUR' },
        paymentMethod: { type: 'giftcard', brand: 'genericgiftcard' },
        shopperReference: 'test@example.com'
      };

      const mockResponse: PartialPaymentOrderResponse = {
        pspReference: 'test-psp-reference',
        orderData: 'encrypted-order-data',
        amount: { value: 1000, currency: 'EUR' },
        paymentMethod: { type: 'giftcard', brand: 'genericgiftcard' }
      };

      const mockCommand = {
        execute: jasmine.createSpy('execute').and.returnValue(of(mockResponse))
      };

      mockCommandService.create.and.returnValue(mockCommand as any);

      const resolveSpy = jasmine.createSpy('resolve');
      const rejectSpy = jasmine.createSpy('reject');

      service.handleOrderRequest(resolveSpy, rejectSpy, mockData);

      expect(resolveSpy).toHaveBeenCalledWith({
        orderData: mockResponse.orderData,
        pspReference: mockResponse.pspReference
      });
    });

    it('should reject when order data is missing', () => {
      const mockData = {
        amount: { value: 1000, currency: 'EUR' },
        paymentMethod: { type: 'giftcard', brand: 'genericgiftcard' },
        shopperReference: 'test@example.com'
      };

      const mockResponse: PartialPaymentOrderResponse = {
        pspReference: 'test-psp-reference',
        orderData: '', // Missing order data
        amount: { value: 1000, currency: 'EUR' },
        paymentMethod: { type: 'giftcard', brand: 'genericgiftcard' }
      };

      const mockCommand = {
        execute: jasmine.createSpy('execute').and.returnValue(of(mockResponse))
      };

      mockCommandService.create.and.returnValue(mockCommand as any);

      const resolveSpy = jasmine.createSpy('resolve');
      const rejectSpy = jasmine.createSpy('reject');

      service.handleOrderRequest(resolveSpy, rejectSpy, mockData);

      expect(rejectSpy).toHaveBeenCalled();
    });
  });

  describe('resetPaymentState', () => {
    it('should reset payment state to initial values', () => {
      service.resetPaymentState();

      service.getPaymentState().subscribe(state => {
        expect(state).toEqual({
          errorCode: '',
          errorFieldCodes: [],
          orderNumber: '',
          partialPaymentId: undefined,
          redirectToNextStep: false
        });
      });
    });
  });
});
