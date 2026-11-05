# Adyen for SAP Composable Storefront

`@adyen/adyen-spartacus` is an Angular library that adds Adyen payments to SAP Composable Storefront (Spartacus). It replaces the payment step of the checkout with the Adyen Web Drop-in and adds express checkout (Google Pay, Apple Pay, PayPal), gift cards and partial payments, stored cards in My Account and My Subscriptions. It talks to the OCC endpoints of the [Adyen plugin for SAP Commerce Cloud](https://github.com/Adyen/adyen-sapcommercecloud).

## Compatibility

| Component | Version |
|---|---|
| `@adyen/adyen-spartacus` | 1.6.0 |
| Adyen plugin for SAP Commerce Cloud | 13.6.0 |
| Angular | `^21.1.0` |
| SAP Composable Storefront (Spartacus) | 221121.7.0 |
| `@adyen/adyen-web` (peer dependency) | `^6.46.0` |

The library is tested with these versions only. Use library 1.6.0 with plugin 13.6.0.

## Installation

The package is not published on npmjs.com. Build it from source and publish it to your own npm registry.

1. Build the library. The repository `.npmrc` points the `@spartacus` scope to `http://localhost:4873`, so run a local registry that proxies npmjs.com (for example [Verdaccio](https://verdaccio.org/)) or change the file first.

   ```bash
   npm install
   npm run lib:build
   ```

2. Publish the output to your registry.

   ```bash
   cd dist/adyen/adyen-spartacus
   npm publish --registry https://<your-registry>
   ```

3. Install the library and its peer packages in your storefront application.

   ```bash
   npm install @adyen/adyen-spartacus@1.6.0 @adyen/adyen-web@^6.46.0 @google-pay/button-angular@^3.2.1
   ```

4. Set up the storefront modules and import the CMS content. The feature module templates are in `projects/adyen/adyen-spartacus/schematics/adyen-payment-step/files/` and the CMS impex files in `projects/adyen/adyen-spartacus/import/`. The full procedure, the backend settings and the customization options are in the wiki page [Composable Storefront](https://github.com/Adyen/adyen-sapcommercecloud/wiki/Composable-Storefront).

## Development

| Command | Purpose |
|---|---|
| `npm run lib:build` | Build the library into `dist/adyen/adyen-spartacus` |
| `npm run lib:test` | Run the library unit tests (Karma) |
| `npm start` | Rebuild the library on change and serve the showcase storefront in `projects/showcase` |

## Documentation and releases

- [Composable Storefront wiki page](https://github.com/Adyen/adyen-sapcommercecloud/wiki/Composable-Storefront)
- [Adyen plugin for SAP Commerce Cloud](https://github.com/Adyen/adyen-sapcommercecloud), the backend that the library requires
- [Releases](https://github.com/Adyen/adyen-spartacus/releases)

## Support

Report bugs and request features in the [GitHub issues](https://github.com/Adyen/adyen-spartacus/issues). For questions about your Adyen account, contact [Adyen Support](https://support.adyen.com/hc/en-us/requests/new?ticket_form_id=360000705420).

## License

MIT. See [LICENSE](LICENSE).
