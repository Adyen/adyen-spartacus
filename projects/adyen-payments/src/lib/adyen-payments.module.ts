import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CheckoutAdyenPaymentMethodModule} from "./checkout-adyen-payment-method/checkout-adyen-payment-method.module";
import {CheckoutAdyenRootModule} from "./root/checkout-adyen-root.module";
import {CheckoutAdyenEventModule} from "./events/checkout-adyen-event.module";
import {CheckoutAdyenConfigurationService} from "./service/checkout-adyen-configuration.service";
import {CheckoutConfigurationConnector} from "./core/connectors/checkout-configuration.connector";
import {OccCheckoutConfigAdapter} from "./core/occ/adapters/occ-checkout-config.adapter";
import {CheckoutAdyenEventListener} from "./events/checkout-adyen-event.listener";
import {PlaceOrderConnector} from "./core/connectors/placeorder.connector";
import {OccPlaceOrderAdapter} from "./core/occ/adapters/occ-placeorder.adapter";
import {AdyenOrderService} from "./service/adyen-order.service";
import {OrderAdapter, OrderConnector} from "@spartacus/order/core"
import {OccOrderAdapter} from "@spartacus/order/occ"
import {AdditionalDetailsConnector} from "./core/connectors/additional-details.connector";
import {OccAdditionalDetailsAdapter} from "./core/occ/adapters/occ-additionaldetails.adapter";


@NgModule({
  imports: [
    CommonModule,
    CheckoutAdyenPaymentMethodModule,
    CheckoutAdyenEventModule,
    CheckoutAdyenRootModule
  ],
  providers: [CheckoutAdyenConfigurationService,
    AdyenOrderService,
    PlaceOrderConnector,
    AdditionalDetailsConnector,
    OrderConnector,
    {
      provide: OrderAdapter,
      useClass: OccOrderAdapter,
    },
    OccPlaceOrderAdapter,
    OccAdditionalDetailsAdapter,
    OccCheckoutConfigAdapter,
    CheckoutAdyenEventListener,
    CheckoutConfigurationConnector],
})
export class AdyenPaymentsModule { }
