import {TestBed} from '@angular/core/testing';
import {HttpErrorResponse} from '@angular/common/http';
import {GlobalMessageService, GlobalMessageType, TranslationService} from '@spartacus/core';
import {of} from 'rxjs';
import {AdyenPlaceOrderErrorService} from './adyen-place-order-error.service';
import {SUBSCRIPTION_ERROR_CODE} from './subscription-guard.const';
import {en} from '../../assets/translations/en';

function lookup(resources: any, key: string): any {
  return key.split('.').reduce((node, part) => node?.[part], resources);
}

describe('AdyenPlaceOrderErrorService', () => {
  let service: AdyenPlaceOrderErrorService;
  let translationService: jasmine.SpyObj<TranslationService>;
  let globalMessageService: jasmine.SpyObj<GlobalMessageService>;

  const httpError = (body: any) => new HttpErrorResponse({status: 400, error: body});

  beforeEach(() => {
    translationService = jasmine.createSpyObj('TranslationService', ['translate']);
    globalMessageService = jasmine.createSpyObj('GlobalMessageService', ['add']);
    translationService.translate.and.callFake((key: string | string[]) => of('T:' + key));
    TestBed.configureTestingModule({
      providers: [
        {provide: TranslationService, useValue: translationService},
        {provide: GlobalMessageService, useValue: globalMessageService}
      ]
    });
    service = TestBed.inject(AdyenPlaceOrderErrorService);
  });

  Object.values(SUBSCRIPTION_ERROR_CODE).forEach((code) => {
    it('maps ' + code + ' to adyenPlaceOrderError.' + code + ' and ships a real English text for it', () => {
      service.showMessage(httpError({errorCode: code}));

      expect(translationService.translate).toHaveBeenCalledWith('adyenPlaceOrderError.' + code);
      expect(globalMessageService.add).toHaveBeenCalledWith('T:adyenPlaceOrderError.' + code, GlobalMessageType.MSG_TYPE_ERROR, 20000);
      const text = lookup(en.paymentErrors, 'adyenPlaceOrderError.' + code);
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(20);
    });
  });

  it('names My Subscriptions in plain text and renders no link while the Spartacus page does not exist', () => {
    const text: string = lookup(en.paymentErrors, 'adyenPlaceOrderError.' + SUBSCRIPTION_ERROR_CODE.ALREADY_OWNED);
    expect(text).toContain('My Subscriptions');
    expect(text).not.toMatch(/<a |href|\/my-account/);
  });

  it('keeps linkPath in the response but does not render it into the message', () => {
    const error = httpError({errorCode: SUBSCRIPTION_ERROR_CODE.ALREADY_OWNED, linkPath: '/my-account/subscriptions'});

    service.showMessage(error);

    expect(service.toResponse(error)).toEqual({
      success: false,
      error: SUBSCRIPTION_ERROR_CODE.ALREADY_OWNED,
      errorFieldCodes: undefined,
      linkPath: '/my-account/subscriptions'
    });
    expect(globalMessageService.add).toHaveBeenCalledWith(
      'T:adyenPlaceOrderError.' + SUBSCRIPTION_ERROR_CODE.ALREADY_OWNED, GlobalMessageType.MSG_TYPE_ERROR, 20000);
  });

  it('leaves unknown codes on the existing behaviour: translate prefix + code, error message, no link', () => {
    service.handle(httpError({errorCode: 'checkout.error.authorization.failed', invalidFields: ['a']})).subscribe((response) => {
      expect(response).toEqual({
        success: false,
        error: 'checkout.error.authorization.failed',
        errorFieldCodes: ['a'],
        linkPath: undefined
      });
    });

    expect(translationService.translate).toHaveBeenCalledWith('adyenPlaceOrderError.checkout.error.authorization.failed');
    expect(globalMessageService.add).toHaveBeenCalledTimes(1);
  });

  it('honours messageTimeout / errorCodePrefix options passed by (subclassed) callers', () => {
    service.handle(httpError({errorCode: 'x'}), {messageTimeout: 5000, errorCodePrefix: 'custom.'}).subscribe();

    expect(translationService.translate).toHaveBeenCalledWith('custom.x');
    expect(globalMessageService.add).toHaveBeenCalledWith('T:custom.x', GlobalMessageType.MSG_TYPE_ERROR, 5000);
  });
});
