import {TestBed} from '@angular/core/testing';
import {GlobalMessageService, GlobalMessageType} from '@spartacus/core';
import {AdyenCartModificationService} from './adyen-cart-modification.service';
import {AdyenSubscriptionLinkService} from './adyen-subscription-link.service';
import {en} from '../../assets/translations/en';
import {adyenCartValidationTranslationsEn} from '../../assets/translations/en/adyen-cart-modification';
import {adyenCheckoutTranslationChunksConfig} from '../../assets/translations/translations';

describe('AdyenCartModificationService', () => {
  let globalMessageService: jasmine.SpyObj<GlobalMessageService>;
  let service: AdyenCartModificationService;
  let linkService: jasmine.SpyObj<AdyenSubscriptionLinkService>;
  const texts = en.adyenCartModification.adyenCartModification;

  beforeEach(() => {
    globalMessageService = jasmine.createSpyObj('GlobalMessageService', ['add']);
    linkService = jasmine.createSpyObj('AdyenSubscriptionLinkService', ['show']);
    TestBed.configureTestingModule({providers: [{provide: AdyenSubscriptionLinkService, useValue: linkService}]});
    service = TestBed.runInInjectionContext(() => new AdyenCartModificationService(globalMessageService));
  });

  ['subscriptionAlreadyOwned', 'subscriptionLimitPerCart'].forEach((code) => {
    it(code + ' after add-to-cart raises an error under adyenCartModification.add.' + code + ' and means nothing was added', () => {
      const modification = {statusCode: code, quantityAdded: 0};
      expect(service.notify(modification, 'add')).toBeTrue();
      expect(globalMessageService.add).toHaveBeenCalledWith(
        {key: 'adyenCartModification.add.' + code}, GlobalMessageType.MSG_TYPE_ERROR, 20000);
      expect(service.isNothingAdded(modification)).toBeTrue();
      expect((texts.add as any)[code]).toContain('not added');
    });

    it(code + ' found by cart validation is a warning with a "removed" text, not "not added"', () => {
      service.notify({statusCode: code, quantityAdded: 0}, 'cart');
      expect(globalMessageService.add).toHaveBeenCalledWith(
        {key: 'adyenCartModification.cart.' + code}, GlobalMessageType.MSG_TYPE_WARNING, 20000);
      expect((texts.cart as any)[code]).toContain('removed');
      expect((texts.cart as any)[code]).not.toContain('not added');
    });
  });

  it('defaults to the cart context', () => {
    service.notify({statusCode: 'subscriptionAlreadyOwned'});
    expect(globalMessageService.add).toHaveBeenCalledWith(
      {key: 'adyenCartModification.cart.subscriptionAlreadyOwned'}, GlobalMessageType.MSG_TYPE_WARNING, 20000);
  });

  it('subscriptionQuantityLimit with quantityAdded 1 is a warning and something was added', () => {
    const modification = {statusCode: 'subscriptionQuantityLimit', quantityAdded: 1};
    service.notify(modification, 'add');
    expect(globalMessageService.add).toHaveBeenCalledWith(
      {key: 'adyenCartModification.add.subscriptionQuantityLimit'}, GlobalMessageType.MSG_TYPE_WARNING, 20000);
    expect(service.isNothingAdded(modification)).toBeFalse();
  });

  it('quantity cap at update with quantityAdded 0 is a warning, not an error', () => {
    const modification = {statusCode: 'subscriptionQuantityLimit', quantityAdded: 0};
    service.notify(modification, 'cart');
    expect(globalMessageService.add).toHaveBeenCalledWith(
      {key: 'adyenCartModification.cart.subscriptionQuantityLimit'}, GlobalMessageType.MSG_TYPE_WARNING, 20000);
  });

  it('subscriptionQuantityLimit with quantityAdded 0 means nothing was added', () => {
    expect(service.isNothingAdded({statusCode: 'subscriptionQuantityLimit', quantityAdded: 0})).toBeTrue();
  });

  it('ignores other status codes (left to Spartacus)', () => {
    ['success', 'noStock', 'lowStock', undefined].forEach((statusCode) => {
      expect(service.notify({statusCode, quantityAdded: 0}, 'add')).toBeFalse();
      expect(service.isNothingAdded({statusCode, quantityAdded: 0})).toBeFalse();
    });
    expect(globalMessageService.add).not.toHaveBeenCalled();
  });

  ['add', 'cart'].forEach((context) => {
    it('shows the My Subscriptions link for subscriptionAlreadyOwned in the ' + context + ' context', () => {
      service.notify({statusCode: 'subscriptionAlreadyOwned', quantityAdded: 0}, context as 'add' | 'cart');
      expect(linkService.show).toHaveBeenCalledOnceWith(20000, {key: 'adyenCartModification.' + context + '.subscriptionAlreadyOwned'});
    });

    ['subscriptionLimitPerCart', 'subscriptionQuantityLimit', 'noStock', undefined].forEach((statusCode) => {
      it('shows no link for ' + statusCode + ' in the ' + context + ' context', () => {
        service.notify({statusCode, quantityAdded: 0}, context as 'add' | 'cart');
        expect(linkService.show).not.toHaveBeenCalled();
      });
    });
  });

  it('keeps the message texts plain (no markup) and ships the link label', () => {
    expect(texts.add.subscriptionAlreadyOwned).not.toMatch(/<a |href|\/my-account/);
    expect(texts.link.mySubscriptions).toBe('Manage your subscriptions');
  });

  it('does not auto-provide a cart bundle (would stop i18next loading cart.json) and registers its own chunk', () => {
    expect((en as any).cart).toBeUndefined();
    expect(adyenCheckoutTranslationChunksConfig['adyenCartModification']).toEqual(['adyenCartModification']);
  });

  it('exports validation.* texts for the consumer cart chunk', () => {
    ['subscriptionAlreadyOwned', 'subscriptionLimitPerCart', 'subscriptionQuantityLimit'].forEach((code) =>
      expect((adyenCartValidationTranslationsEn.validation as any)[code]).toEqual(jasmine.any(String)));
  });
});
