# SAP Composable Storefront - Adyen Payments Library

This repository contains an Angular library that integrates Adyen payments into the SAP Composable Storefront, specifically designed for the Spartacus framework.

Latest stable version: https://github.com/Adyen/adyen-spartacus/releases

## Requirements

- Angular version: 21.1.0
- Spartacus version: 221121.7.0

## Installation

### Prerequisites

Before installing the Adyen Payments library, ensure that you have a local npm registry running. If not, you can start one with [Verdaccio](https://verdaccio.org/).

### Build and Publish the Library

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Adyen/adyen-spartacus/
   cd adyen-spartacus/projects/adyen/adyen-spartacus
   ```
2. **Build the package**:

   ```bash
   npm run build
   ```
3. **Publish the package to the local npm registry**:

   ```bash
   npm --registry http://localhost:4873 publish --access public
   ```

### Installation on SAP Composable Storefront

**Install the Adyen Payments library**:

    ng add adyen-payments --registry http://localhost:4873

This will automatically configure your storefront to include Adyen Payments functionality if it is a clean installation.

### Manual Configuration (Non-clean Installations):

If your Spartacus storefront already has modifications, you might need to manually update the **checkout-feature.module.ts** and **order-feature.module.ts** files.
Refer to the templates provided in the schematics directory of the Adyen Payments library for the correct configurations.

## Duplicate-subscription messages

When the backend refuses a duplicate subscription, the library shows translated messages (English; the library ships `en` only):

- Payment refusals (`checkout.error.subscriptionAlreadyOwned`, `subscriptionLimitPerCart`, `subscriptionQuantityLimit`) on place-order, partial payment and Google/Apple/PayPal express: `adyenPlaceOrderError.*`. Subclasses of `AdyenOrderService` / `AdyenPartialPaymentService` keep working: their `messageTimeout` / `placeOrderErrorCodePrefix` overrides are passed to `AdyenPlaceOrderErrorService`.
- Cart modifications (`statusCode` of add-to-cart, update-entry and cart validation): global messages from the library-owned `adyenCartModification.*` namespace (auto-provided chunk, no action needed). A failed add-to-cart also closes the "added to cart" dialog (only when it follows the add-to-cart click of the same product).
- Cart page warning (`cx-cart-item-validation-warning`, relevant for `subscriptionQuantityLimit`, where the entry stays in the cart) renders `validation.<statusCode>` from Spartacus' own `cart` chunk. The library deliberately does not provide a `cart` bundle (with `i18n.backend` i18next would then skip loading `cart.json`), so add the texts yourself:
  - static resources: merge the exported constant into your `cart` chunk: `provideConfig(<I18nConfig>{ i18n: { resources: { en: { cart: adyenCartValidationTranslationsEn } } } })`;
  - `i18n.backend` (`loadPath`): add `validation.subscriptionAlreadyOwned`, `validation.subscriptionLimitPerCart` and `validation.subscriptionQuantityLimit` to your `cart.json`.

The storefront **must enable cart validation**, otherwise a duplicate removed by the backend at checkout start is not reported (the library does not force this setting):

```ts
provideConfig(<CartConfig>{ cart: { validation: { enabled: true } } })
```

`AdyenCheckoutModule` (which imports `AdyenCartModificationModule`) must be imported eagerly in the root injector (e.g. `AppModule`), not in a lazy-loaded module: the module registers an `HTTP_INTERCEPTORS` entry and a root listener.

At checkout start Spartacus' own generic `validation.cartEntriesChangeDuringCheckout` message appears in addition to ours. This is accepted.

`cx-global-message` renders translated text only, so for `subscriptionAlreadyOwned` (cart add, cart validation, payment refusal with `errorCode` `checkout.error.subscriptionAlreadyOwned`) the library shows a "Manage your subscriptions" link (`AdyenSubscriptionLinkComponent`, label `adyenCartModification.link.mySubscriptions`) directly below the global messages, in the `cx-header` outlet (position AFTER, registered with `provideOutlet` by `AdyenCartModificationModule`); the link is tied to its message and hides when that message leaves the global messages (expired or closed), on click or on its close button (20 s fallback timer). Its host is `position: sticky; z-index: 2`, so it stays visible together with the sticky message; tune the offset below the message with the CSS custom property `--adyen-subscription-link-top` (default `3.5rem`, e.g. `cx-adyen-subscription-link { --adyen-subscription-link-top: 4.5rem; }`). The link is registered with `provideOutlet`, which is read only by `OutletModule.forRoot()`/`forChild()`, so `AdyenCheckoutModule` must be imported eagerly (see above), not in a lazy module. The target is the semantic route `mySubscriptions` (default path `my-account/subscriptions`, matching the backend's `linkPath` and the My Subscriptions CMS page label); override it with `provideConfig({routing: {routes: {mySubscriptions: {paths: [...]}}}})`. On the payment path the link is triggered by the `errorCode` alone (other codes get no link, even if they carry `linkPath`); the backend's `linkPath` is not used. The `validation.*` texts of the cart page stay text-only (that Spartacus component cannot render a link).

## Known Issues

This is an alpha release and may contain bugs. Please report any issues you encounter.
The library has been tested with the specified versions of Angular and Spartacus only. Compatibility with other versions is not guaranteed.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
