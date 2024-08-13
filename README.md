# SAP Composable Storefront - Adyen Payments Library ( 0.3 Alpha)

This repository contains an Angular library that integrates Adyen payments into the SAP Composable Storefront, specifically designed for the Spartacus framework. Please note that this is an **unstable alpha version**, and it is still under development. Use it at your own risk and in testing environments only.

## Requirements

- Angular version: `17.3.0`
- Spartacus version: `2211.23.0-1`

## Installation

### Prerequisites

Before installing the Adyen Payments library, ensure that you have a local npm registry running. If not, you can start one with [Verdaccio](https://verdaccio.org/).

### Build and Publish the Library

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Adyen/adyen-spartacus/
   cd adyen-spartacus/projects/adyen-payments
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

## Known Issues
This is an alpha release and may contain bugs. Please report any issues you encounter.
The library has been tested with the specified versions of Angular and Spartacus only. Compatibility with other versions is not guaranteed.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
