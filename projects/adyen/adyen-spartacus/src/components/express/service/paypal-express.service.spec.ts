import {TestBed} from '@angular/core/testing';
import {HttpErrorResponse} from '@angular/common/http';
import {of, throwError} from 'rxjs';
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {CommandService, EventService, GlobalMessageService, GlobalMessageType, TranslationService, UserIdService} from '@spartacus/core';
import {PaypalExpressService} from './paypal-express.service';
import {AdyenOrderConnector} from '../../../core/connectors/adyen-order-connector.service';
import {AdditionalDetailsConnector} from '../../../core/connectors/additional-details.connector';
import {SUBSCRIPTION_ERROR_CODE} from '../../../core/subscription/subscription-guard.const';

describe('PaypalExpressService subscription refusals', () => {
  let service: PaypalExpressService;
  let connector: jasmine.SpyObj<AdyenOrderConnector>;
  let globalMessageService: jasmine.SpyObj<GlobalMessageService>;
  let translationService: jasmine.SpyObj<TranslationService>;

  const httpError = (errorCode: string) => new HttpErrorResponse({status: 400, error: {errorCode}});

  beforeEach(() => {
    connector = jasmine.createSpyObj('AdyenOrderConnector', ['handlePayPalSubmit', 'updatePaypalOrder']);
    globalMessageService = jasmine.createSpyObj('GlobalMessageService', ['add']);
    translationService = jasmine.createSpyObj('TranslationService', ['translate']);
    translationService.translate.and.callFake((key: string | string[]) => of('T:' + key));
    const userIdService = jasmine.createSpyObj('UserIdService', ['takeUserId']);
    userIdService.takeUserId.and.returnValue(of('current'));
    const activeCartFacade = jasmine.createSpyObj('ActiveCartFacade', ['takeActiveCartId', 'isGuestCart']);
    activeCartFacade.takeActiveCartId.and.returnValue(of('0001'));
    activeCartFacade.isGuestCart.and.returnValue(of(false));
    const commandService = {
      create: (fn: any) => ({execute: (command: any) => fn(command)})
    };

    TestBed.configureTestingModule({
      providers: [
        PaypalExpressService,
        {provide: AdyenOrderConnector, useValue: connector},
        {provide: AdditionalDetailsConnector, useValue: {}},
        {provide: ActiveCartFacade, useValue: activeCartFacade},
        {provide: UserIdService, useValue: userIdService},
        {provide: CommandService, useValue: commandService},
        {provide: EventService, useValue: jasmine.createSpyObj('EventService', ['dispatch'])},
        {provide: GlobalMessageService, useValue: globalMessageService},
        {provide: TranslationService, useValue: translationService}
      ]
    });
    service = TestBed.inject(PaypalExpressService);
  });

  it('shows the translated message when PayPal submit is refused as a duplicate subscription', () => {
    connector.handlePayPalSubmit.and.returnValue(throwError(() => httpError(SUBSCRIPTION_ERROR_CODE.ALREADY_OWNED)));
    let result: any;

    service.submitPayPal({paymentMethod: {}} as any, undefined as any, '0001').subscribe((r) => result = r);

    expect(result).toEqual({resultCode: 'Error'});
    expect(globalMessageService.add).toHaveBeenCalledWith(
      'T:adyenPlaceOrderError.' + SUBSCRIPTION_ERROR_CODE.ALREADY_OWNED, GlobalMessageType.MSG_TYPE_ERROR, 20000);
  });

  it('shows the translated message when PayPal order update is refused as a duplicate subscription', () => {
    connector.updatePaypalOrder.and.returnValue(throwError(() => httpError(SUBSCRIPTION_ERROR_CODE.LIMIT_PER_CART)));
    let result: any;

    service.updatePaypalOrder('0001', {} as any).subscribe((r) => result = r);

    expect(result).toEqual({paymentData: null, status: 'ERROR'});
    expect(globalMessageService.add).toHaveBeenCalledWith(
      'T:adyenPlaceOrderError.' + SUBSCRIPTION_ERROR_CODE.LIMIT_PER_CART, GlobalMessageType.MSG_TYPE_ERROR, 20000);
  });

  it('stays silent for other errors (the Drop-in shows its own failure)', () => {
    connector.handlePayPalSubmit.and.returnValue(throwError(() => httpError('checkout.error.authorization.failed')));

    service.submitPayPal({paymentMethod: {}} as any, undefined as any, '0001').subscribe();

    expect(globalMessageService.add).not.toHaveBeenCalled();
  });
});
