import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {CheckoutAdyenPaymentMethodModule} from "./checkout-adyen-payment-method/checkout-adyen-payment-method.module";
import {CheckoutAdyenRootModule} from "./root/checkout-adyen-root.module";
import {CheckoutAdyenEventModule} from "./events/checkout-adyen-event.module";
import {CheckoutAdyenConfigurationService} from "./service/checkout-adyen-configuration.service";
import {CheckoutConfigurationConnector} from "./core/connectors/checkout-configuration.connector";
import {OccCheckoutConfigAdapter} from "./core/occ/adapters/occ-checkout-config.adapter";
import {CheckoutAdyenEventListener} from "./events/checkout-adyen-event.listener";



@NgModule({
  imports: [
    CommonModule,
    CheckoutAdyenPaymentMethodModule,
    CheckoutAdyenEventModule,
    CheckoutAdyenRootModule
  ],
  providers: [CheckoutAdyenConfigurationService,
    OccCheckoutConfigAdapter,
    CheckoutAdyenEventListener,
    CheckoutConfigurationConnector],
})
export class AdyenPaymentsModule { }
