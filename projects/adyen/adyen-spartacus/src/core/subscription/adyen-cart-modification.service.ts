import {Injectable} from '@angular/core';
import {CartModification} from '@spartacus/cart/base/root';
import {GlobalMessageService, GlobalMessageType} from '@spartacus/core';
import {SUBSCRIPTION_STATUS_CODE, SUBSCRIPTION_STATUS_CODES} from './subscription-guard.const';

/**
 * Shows the duplicate-subscription `CartModification.statusCode` values to the shopper as global messages.
 * The texts live in the library-owned `adyenCartModification` namespace (`add.<statusCode>` right after an
 * add-to-cart, `cart.<statusCode>` when the cart was changed afterwards), see assets/translations/en/adyen-cart-modification.ts.
 *
 * DEFERRED: the `subscriptionAlreadyOwned` text names "My Subscriptions" without a link,
 * because that page does not exist on Spartacus yet. Render the link in {@link notify} when it does.
 */
/** `add`: response of an add-to-cart; `cart`: cart validation / update-entry (an existing entry was changed or removed). */
export type CartModificationContext = 'add' | 'cart';

@Injectable({providedIn: 'root'})
export class AdyenCartModificationService {
  protected messageTimeout: number = 20000;

  constructor(protected globalMessageService: GlobalMessageService) {
  }

  isSubscriptionStatusCode(statusCode?: string): boolean {
    return !!statusCode && SUBSCRIPTION_STATUS_CODES.includes(statusCode);
  }

  /**
   * True when the modification means the product was NOT put into the cart (so a "added to cart" dialog would lie).
   */
  isNothingAdded(modification: Partial<CartModification>): boolean {
    if (!this.isSubscriptionStatusCode(modification.statusCode)) {
      return false;
    }
    return modification.statusCode !== SUBSCRIPTION_STATUS_CODE.QUANTITY_LIMIT || modification.quantityAdded === 0;
  }

  /**
   * Adds the global message for a subscription status code; returns whether one was added.
   * Other (non-subscription) status codes are left to Spartacus. After an add-to-cart that added nothing the message
   * is an error; for changes to an existing cart (`cart` context) it is a warning.
   */
  notify(modification: Partial<CartModification>, context: CartModificationContext = 'cart'): boolean {
    if (!this.isSubscriptionStatusCode(modification.statusCode)) {
      return false;
    }
    const type = context === 'add' && this.isNothingAdded(modification)
      ? GlobalMessageType.MSG_TYPE_ERROR
      : GlobalMessageType.MSG_TYPE_WARNING;
    this.globalMessageService.add({key: 'adyenCartModification.' + context + '.' + modification.statusCode}, type, this.messageTimeout);
    return true;
  }
}
