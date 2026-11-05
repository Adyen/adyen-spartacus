# @adyen/adyen-spartacus

Adyen payments for SAP Composable Storefront (Spartacus). The library replaces the payment step of the checkout with the Adyen Web Drop-in and adds express checkout (Google Pay, Apple Pay, PayPal), gift cards and partial payments, stored cards in My Account and My Subscriptions. It calls the OCC endpoints of the [Adyen plugin for SAP Commerce Cloud](https://github.com/Adyen/adyen-sapcommercecloud).

## Compatibility

| Component | Version |
|---|---|
| `@adyen/adyen-spartacus` | 1.6.0 |
| Adyen plugin for SAP Commerce Cloud | 13.6.0 |
| Angular | `^21.1.0` |
| SAP Composable Storefront (Spartacus) | 221121.7.0 |
| `@adyen/adyen-web` (peer dependency) | `^6.46.0` |

## Installation

```bash
npm install @adyen/adyen-spartacus@1.6.0 @adyen/adyen-web@^6.46.0 @google-pay/button-angular@^3.2.1
```

Then import the library modules in your storefront and import the CMS content into SAP Commerce. The procedure, the required backend settings and the customization options are described in the wiki page [Composable Storefront](https://github.com/Adyen/adyen-sapcommercecloud/wiki/Composable-Storefront).

## Links

- [Source code and build instructions](https://github.com/Adyen/adyen-spartacus)
- [Releases](https://github.com/Adyen/adyen-spartacus/releases)
- [MIT License](https://github.com/Adyen/adyen-spartacus/blob/HEAD/LICENSE)
