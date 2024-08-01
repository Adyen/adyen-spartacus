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
import {OrderAdapter, OrderConnector, OrderHistoryConnector, OrderHistoryAdapter} from "@spartacus/order/core"
import {OccOrderAdapter, OccOrderHistoryAdapter} from "@spartacus/order/occ"
import {AdyenAddressService} from "./service/adyen-address.service";
import {AdditionalDetailsConnector} from "./core/connectors/additional-details.connector";
import {OccAdditionalDetailsAdapter} from "./core/occ/adapters/occ-additionaldetails.adapter";
import {AdyenRedirectModule} from "./adyen-redirect/adyen-redirect.module";
import { provideDefaultConfig } from '@spartacus/core';


@NgModule({
  imports: [
    CommonModule,
    CheckoutAdyenPaymentMethodModule,
    CheckoutAdyenEventModule,
    CheckoutAdyenRootModule,
    AdyenRedirectModule
  ],
  providers: [CheckoutAdyenConfigurationService,
    AdyenOrderService,
    AdyenAddressService,
    PlaceOrderConnector,
    AdditionalDetailsConnector,
    OrderConnector,
    {
      provide: OrderAdapter,
      useClass: OccOrderAdapter,
    },
    provideDefaultConfig({
      backend: {
        occ: {
          endpoints: {
            orderDetail: 'users/${userId}/orders/${orderId}?fields=FULL'
          }
        }
      }
    }),
    {
      provide: OrderHistoryAdapter,
      useClass: OccOrderHistoryAdapter
    },
    OccPlaceOrderAdapter,
    OccAdditionalDetailsAdapter,
    OccCheckoutConfigAdapter,
    CheckoutAdyenEventListener,
    CheckoutConfigurationConnector,
    OrderHistoryConnector],
})
export class AdyenPaymentsModule {
}
