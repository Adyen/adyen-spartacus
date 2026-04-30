import {CheckoutConfigurationConnector} from "./connectors/checkout-configuration.connector";
import {NgModule} from "@angular/core";

@NgModule({
  providers: [
    CheckoutConfigurationConnector,
  ],
})
export class CheckoutCoreModule {}
