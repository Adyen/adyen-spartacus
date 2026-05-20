import {CheckoutConfigurationConnector} from "./connectors/checkout-configuration.connector";
import {NgModule} from "@angular/core";
import {AdyenPartialPaymentModule} from "./partial-payment/adyen-partial-payment.module";

@NgModule({
  imports: [
    AdyenPartialPaymentModule
  ],
  providers: [
    CheckoutConfigurationConnector,
  ],
})
export class CheckoutCoreModule {}
