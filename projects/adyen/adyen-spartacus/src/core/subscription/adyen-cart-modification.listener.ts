import {Injectable, OnDestroy} from '@angular/core';
import {
  CartAddEntrySuccessEvent,
  CartModification,
  CartUiEventAddToCart,
  CartValidationFacade
} from '@spartacus/cart/base/root';
import {EventService} from '@spartacus/core';
import {LaunchDialogService} from '@spartacus/storefront';
import {Subscription} from 'rxjs';
import {AdyenCartModificationService} from './adyen-cart-modification.service';

/**
 * Surfaces duplicate-subscription cart modifications:
 *  - add to cart: `CartAddEntrySuccessEvent` carries the OCC `CartModification` fields at runtime (Spartacus spreads
 *    the response into the action payload) although only `quantityAdded` is typed; `statusCode` is read untyped.
 *    When nothing was added, the "added to cart" dialog is closed, as Spartacus does on `CartAddEntryFailEvent`.
 *    The success event also comes from CSV import, quick order, saved carts..., so the dialog is only closed when
 *    it correlates with the preceding `CartUiEventAddToCart` (the event that opens that dialog) for the same product.
 *  - cart validation (checkout start): `CartValidationFacade.getValidationResults()`. Only emits when the storefront
 *    enables `cart.validation.enabled` (see README).
 * Update-entry responses are handled by {@link AdyenCartModificationInterceptor}.
 */
@Injectable({providedIn: 'root'})
export class AdyenCartModificationListener implements OnDestroy {
  protected subscriptions = new Subscription();
  /** productCode of the last add-to-cart that opened the "added to cart" dialog and is not resolved yet. */
  protected pendingDialogProductCode?: string;

  constructor(
    protected eventService: EventService,
    protected cartModificationService: AdyenCartModificationService,
    protected launchDialogService: LaunchDialogService,
    protected cartValidationFacade: CartValidationFacade
  ) {
    this.onAddToCartUiEvent();
    this.onAddEntrySuccess();
    this.onValidationResults();
  }

  protected onAddToCartUiEvent(): void {
    this.subscriptions.add(
      this.eventService.get(CartUiEventAddToCart).subscribe((event) => {
        this.pendingDialogProductCode = event.productCode;
      })
    );
  }

  protected onAddEntrySuccess(): void {
    this.subscriptions.add(
      this.eventService.get(CartAddEntrySuccessEvent).subscribe((event) => {
        const modification = event as Partial<CartModification>;
        const dialogOpened = !!this.pendingDialogProductCode && this.pendingDialogProductCode === event.productCode;
        if (dialogOpened) {
          this.pendingDialogProductCode = undefined;
        }
        if (this.cartModificationService.notify(modification, 'add')
          && dialogOpened
          && this.cartModificationService.isNothingAdded(modification)) {
          this.launchDialogService.closeDialog('Subscription not added');
        }
      })
    );
  }

  protected onValidationResults(): void {
    this.subscriptions.add(
      this.cartValidationFacade.getValidationResults().subscribe((modifications) =>
        (modifications ?? []).forEach((modification) => this.cartModificationService.notify(modification, 'cart'))
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
