import {CartAddEntrySuccessEvent, CartUiEventAddToCart, CartValidationFacade} from '@spartacus/cart/base/root';
import {EventService} from '@spartacus/core';
import {LaunchDialogService} from '@spartacus/storefront';
import {Subject} from 'rxjs';
import {AdyenCartModificationListener} from './adyen-cart-modification.listener';
import {AdyenCartModificationService} from './adyen-cart-modification.service';

describe('AdyenCartModificationListener', () => {
  let addSuccess$: Subject<any>;
  let addUi$: Subject<any>;
  let validation$: Subject<any[]>;
  let cartModificationService: jasmine.SpyObj<AdyenCartModificationService>;
  let launchDialogService: jasmine.SpyObj<LaunchDialogService>;
  let listener: AdyenCartModificationListener;

  beforeEach(() => {
    addSuccess$ = new Subject();
    addUi$ = new Subject();
    validation$ = new Subject();
    const eventService = jasmine.createSpyObj('EventService', ['get']);
    eventService.get.withArgs(CartUiEventAddToCart).and.returnValue(addUi$);
    eventService.get.withArgs(CartAddEntrySuccessEvent).and.returnValue(addSuccess$);
    cartModificationService = jasmine.createSpyObj('AdyenCartModificationService', ['notify', 'isNothingAdded']);
    launchDialogService = jasmine.createSpyObj('LaunchDialogService', ['closeDialog']);
    const cartValidationFacade = jasmine.createSpyObj('CartValidationFacade', ['getValidationResults']);
    cartValidationFacade.getValidationResults.and.returnValue(validation$);
    listener = new AdyenCartModificationListener(
      eventService, cartModificationService, launchDialogService, cartValidationFacade as CartValidationFacade);
  });

  it('closes the added-to-cart dialog when a subscription status means nothing was added', () => {
    cartModificationService.notify.and.returnValue(true);
    cartModificationService.isNothingAdded.and.returnValue(true);

    addUi$.next({productCode: 'p'});
    addSuccess$.next({productCode: 'p', quantity: 1, quantityAdded: 0, statusCode: 'subscriptionAlreadyOwned'});

    expect(cartModificationService.notify).toHaveBeenCalledWith(jasmine.objectContaining({statusCode: 'subscriptionAlreadyOwned'}), 'add');
    expect(launchDialogService.closeDialog).toHaveBeenCalled();
  });

  it('does not close a dialog for an add that did not come from the add-to-cart click (CSV import, quick order)', () => {
    cartModificationService.notify.and.returnValue(true);
    cartModificationService.isNothingAdded.and.returnValue(true);

    addSuccess$.next({productCode: 'p', quantity: 1, quantityAdded: 0, statusCode: 'subscriptionAlreadyOwned'});

    expect(cartModificationService.notify).toHaveBeenCalled();
    expect(launchDialogService.closeDialog).not.toHaveBeenCalled();
  });

  it('does not close the dialog when the click was for a different product, nor twice for one click', () => {
    cartModificationService.notify.and.returnValue(true);
    cartModificationService.isNothingAdded.and.returnValue(true);

    addUi$.next({productCode: 'other'});
    addSuccess$.next({productCode: 'p', quantityAdded: 0, statusCode: 'subscriptionAlreadyOwned'});
    expect(launchDialogService.closeDialog).not.toHaveBeenCalled();

    addUi$.next({productCode: 'p'});
    addSuccess$.next({productCode: 'p', quantityAdded: 0, statusCode: 'subscriptionAlreadyOwned'});
    addSuccess$.next({productCode: 'p', quantityAdded: 0, statusCode: 'subscriptionAlreadyOwned'});
    expect(launchDialogService.closeDialog).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open when the quantity was only capped (something was added)', () => {
    cartModificationService.notify.and.returnValue(true);
    cartModificationService.isNothingAdded.and.returnValue(false);

    addUi$.next({productCode: 'p'});
    addSuccess$.next({productCode: 'p', quantity: 3, quantityAdded: 1, statusCode: 'subscriptionQuantityLimit'});

    expect(launchDialogService.closeDialog).not.toHaveBeenCalled();
  });

  it('does not touch the dialog for unrelated add-to-cart results', () => {
    cartModificationService.notify.and.returnValue(false);
    cartModificationService.isNothingAdded.and.returnValue(false);

    addSuccess$.next({productCode: 'p', quantity: 1, quantityAdded: 1, statusCode: 'success'});

    expect(launchDialogService.closeDialog).not.toHaveBeenCalled();
  });

  it('notifies every validation modification', () => {
    const a = {statusCode: 'subscriptionAlreadyOwned'};
    const b = {statusCode: 'noStock'};

    validation$.next([a, b]);

    expect(cartModificationService.notify).toHaveBeenCalledTimes(2);
    expect(cartModificationService.notify).toHaveBeenCalledWith(a, 'cart');
    expect(cartModificationService.notify).toHaveBeenCalledWith(b, 'cart');
  });

  it('stops listening on destroy', () => {
    listener.ngOnDestroy();
    validation$.next([{statusCode: 'subscriptionAlreadyOwned'}]);
    expect(cartModificationService.notify).not.toHaveBeenCalled();
  });
});
