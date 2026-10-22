/**
 * Duplicate-subscription guard: a duplicate cart entry is removed with a cart modification, and one subscription
 * product per cart with quantity one is enforced.
 *
 * Payment refusals: HTTP 400 `ErrorResponse.errorCode`, translated under
 * `adyenPlaceOrderError.<errorCode>` (see assets/translations/en/payment-errors.ts).
 * Cart modifications: `CartModification.statusCode`, translated under
 * `adyenCartModification.add.<statusCode>` / `adyenCartModification.cart.<statusCode>` (see assets/translations/en/adyen-cart-modification.ts).
 */
export const SUBSCRIPTION_ERROR_CODE = {
  ALREADY_OWNED: 'checkout.error.subscriptionAlreadyOwned',
  LIMIT_PER_CART: 'checkout.error.subscriptionLimitPerCart',
  QUANTITY_LIMIT: 'checkout.error.subscriptionQuantityLimit',
} as const;

export const SUBSCRIPTION_STATUS_CODE = {
  ALREADY_OWNED: 'subscriptionAlreadyOwned',
  LIMIT_PER_CART: 'subscriptionLimitPerCart',
  QUANTITY_LIMIT: 'subscriptionQuantityLimit',
} as const;

export const SUBSCRIPTION_STATUS_CODES: readonly string[] = Object.values(SUBSCRIPTION_STATUS_CODE);

export function isSubscriptionErrorCode(errorCode?: string): boolean {
  return Object.values<string>(SUBSCRIPTION_ERROR_CODE).includes(errorCode ?? '');
}
