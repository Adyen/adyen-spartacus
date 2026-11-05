/**
 * Duplicate-subscription cart messages, in the library-owned `adyenCartModification` namespace/chunk (auto-provided).
 *  - `add.*`: the product was just put into the cart (add-to-cart response).
 *  - `cart.*`: the cart was changed after the fact (cart validation at checkout start, update-entry response).
 * `link.mySubscriptions`: label of the link to My Subscriptions (AdyenSubscriptionLinkComponent), shown after `subscriptionAlreadyOwned`.
 * `cx-global-message` renders text only, hence the separate link; the texts below stay plain.
 */
export const adyenCartModification = {
  adyenCartModification: {
    link: {
      mySubscriptions: "Manage your subscriptions"
    },
    add: {
      subscriptionAlreadyOwned: "You already have this subscription, so it was not added to your cart. You can see your subscriptions under My Subscriptions in your account.",
      subscriptionLimitPerCart: "A cart can contain only one subscription. The subscription was not added; please check out your cart first or remove the existing subscription.",
      subscriptionQuantityLimit: "A subscription can only be ordered with a quantity of 1. The quantity was set to 1."
    },
    cart: {
      subscriptionAlreadyOwned: "A subscription was removed from your cart because you already have this subscription. You can see your subscriptions under My Subscriptions in your account.",
      subscriptionLimitPerCart: "A cart can contain only one subscription, so an additional subscription was removed from your cart.",
      subscriptionQuantityLimit: "A subscription can only be ordered with a quantity of 1. The quantity was set to 1."
    }
  }
};

/**
 * Texts for Spartacus' cart-page `cx-cart-item-validation-warning`, which renders `validation.<statusCode>` from
 * Spartacus' own `cart` chunk (only relevant for `subscriptionQuantityLimit`, where the entry stays in the cart).
 * Text-only on purpose: that component cannot render a link, and the link to My Subscriptions for a removed duplicate
 * comes from the global message flow (AdyenCartModificationService).
 * NOT auto-provided: providing a `cart` bundle from a library makes i18next skip loading `cart.json` when
 * `i18n.backend.loadPath` is used. Consumers with static resources merge it into their `cart` chunk
 * (`resources: {en: {cart: adyenCartValidationTranslationsEn}}`); with `i18n.backend`, add the keys to `cart.json`.
 */
export const adyenCartValidationTranslationsEn = {
  validation: {
    subscriptionAlreadyOwned: "You already have this subscription, so it was removed from your cart.",
    subscriptionLimitPerCart: "A cart can contain only one subscription, so an additional subscription was removed from your cart.",
    subscriptionQuantityLimit: "A subscription can only be ordered with a quantity of 1. The quantity was set to 1."
  }
};
