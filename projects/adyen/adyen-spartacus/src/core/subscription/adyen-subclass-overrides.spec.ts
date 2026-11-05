import {Injectable} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {HttpErrorResponse} from '@angular/common/http';
import {of, throwError} from 'rxjs';
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {
  CommandService, EventService, GlobalMessageService, GlobalMessageType, TranslationService, UserIdService
} from '@spartacus/core';
import {OrderConnector, OrderHistoryConnector} from '@spartacus/order/core';
import {AdyenOrderService} from '../services/adyen-order.service';
import {AdyenPartialPaymentService} from '../services/adyen-partial-payment.service';
import {AdyenOrderConnector} from '../connectors/adyen-order-connector.service';
import {AdditionalDetailsConnector} from '../connectors/additional-details.connector';
import {AdyenPartialPaymentConnector} from '../connectors/adyen-partial-payment.connector';

@Injectable()
class CustomOrderService extends AdyenOrderService {
  protected override messageTimeout = 1234;
  protected override placeOrderErrorCodePrefix = 'merchant.';
}

@Injectable()
class CustomPartialPaymentService extends AdyenPartialPaymentService {
  protected override messageTimeout = 4321;
  protected override placeOrderErrorCodePrefix = 'merchantPartial.';

  fail(error: HttpErrorResponse) {
    return this.handleError(error);
  }
}

/** Merchant subclasses overriding messageTimeout / placeOrderErrorCodePrefix must keep working (README). */
describe('merchant overrides of messageTimeout / placeOrderErrorCodePrefix', () => {
  let globalMessageService: jasmine.SpyObj<GlobalMessageService>;
  let translationService: jasmine.SpyObj<TranslationService>;
  let additionalDetailsConnector: jasmine.SpyObj<AdditionalDetailsConnector>;
  const httpError = new HttpErrorResponse({status: 400, error: {errorCode: 'some.code'}});

  beforeEach(() => {
    globalMessageService = jasmine.createSpyObj('GlobalMessageService', ['add', 'get']);
    globalMessageService.get.and.returnValue(of({}));
    translationService = jasmine.createSpyObj('TranslationService', ['translate']);
    translationService.translate.and.callFake((key: string | string[]) => of('T:' + key));
    additionalDetailsConnector = jasmine.createSpyObj('AdditionalDetailsConnector', ['sendAdditionalDetails']);
    const userIdService = jasmine.createSpyObj('UserIdService', ['takeUserId']);
    userIdService.takeUserId.and.returnValue(of('current'));
    const activeCartFacade = jasmine.createSpyObj('ActiveCartFacade', ['takeActiveCartId', 'isGuestCart']);
    activeCartFacade.takeActiveCartId.and.returnValue(of('0001'));
    activeCartFacade.isGuestCart.and.returnValue(of(false));

    TestBed.configureTestingModule({
      providers: [
        CustomOrderService,
        CustomPartialPaymentService,
        {provide: CommandService, useValue: {create: (fn: any) => ({execute: (arg: any) => fn(arg)})}},
        {provide: GlobalMessageService, useValue: globalMessageService},
        {provide: TranslationService, useValue: translationService},
        {provide: UserIdService, useValue: userIdService},
        {provide: ActiveCartFacade, useValue: activeCartFacade},
        {provide: EventService, useValue: jasmine.createSpyObj('EventService', ['dispatch'])},
        {provide: OrderConnector, useValue: {}},
        {provide: OrderHistoryConnector, useValue: {}},
        {provide: AdyenOrderConnector, useValue: {}},
        {provide: AdditionalDetailsConnector, useValue: additionalDetailsConnector},
        {provide: AdyenPartialPaymentConnector, useValue: {}}
      ]
    });
  });

  it('AdyenOrderService subclass: the overridden prefix and timeout reach the message', () => {
    additionalDetailsConnector.sendAdditionalDetails.and.returnValue(throwError(() => httpError));
    const service = TestBed.inject(CustomOrderService);

    service.sendAdditionalDetails({}).subscribe();

    expect(translationService.translate).toHaveBeenCalledWith('merchant.some.code');
    expect(globalMessageService.add).toHaveBeenCalledWith('T:merchant.some.code', GlobalMessageType.MSG_TYPE_ERROR, 1234);
  });

  it('AdyenPartialPaymentService subclass: the overridden prefix and timeout reach the message', () => {
    const service = TestBed.inject(CustomPartialPaymentService);

    service.fail(httpError).subscribe();

    expect(translationService.translate).toHaveBeenCalledWith('merchantPartial.some.code');
    expect(globalMessageService.add).toHaveBeenCalledWith('T:merchantPartial.some.code', GlobalMessageType.MSG_TYPE_ERROR, 4321);
  });
});
