import {CheckoutConfigurationConnector} from "./connectors/checkout-configuration.connector";
import {facadeProviders} from "@spartacus/checkout/base/core/facade/facade-providers";
import {NgModule} from "@angular/core";

@NgModule({
  providers: [
    ...facadeProviders,
    CheckoutConfigurationConnector,
  ],
})
export class CheckoutCoreModule {}
