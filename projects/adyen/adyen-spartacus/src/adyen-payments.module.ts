import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CheckoutAdyenPaymentMethodModule} from "./checkout-adyen-payment-method/checkout-adyen-payment-method.module";
import {CheckoutAdyenRootModule} from "./root/checkout-adyen-root.module";
import {CheckoutAdyenEventModule} from "./events/checkout-adyen-event.module";
import {CheckoutAdyenConfigurationService} from "./service/checkout-adyen-configuration.service";
import {CheckoutConfigurationConnector} from "./core/connectors/checkout-configuration.connector";
import {OccCheckoutConfigAdapter} from "./core/occ/adapters/occ-checkout-config.adapter";
import {CheckoutAdyenEventListener} from "./events/checkout-adyen-event.listener";
import {AdyenOrderService} from "./service/adyen-order.service";
import {OrderAdapter, OrderConnector, OrderHistoryConnector, OrderHistoryAdapter} from "@spartacus/order/core"
import {OccOrderAdapter, OccOrderHistoryAdapter} from "@spartacus/order/occ"
import {AdyenAddressService} from "./service/adyen-address.service";
import {AdditionalDetailsConnector} from "./core/connectors/additional-details.connector";
import {OccAdditionalDetailsAdapter} from "./core/occ/adapters/occ-additionaldetails.adapter";
import {AdyenRedirectModule} from "./adyen-redirect/adyen-redirect.module";
import {I18nConfig, provideConfig, provideDefaultConfig} from '@spartacus/core';
import {adyenCheckoutTranslationChunksConfig, adyenCheckoutTranslations} from "./assets/translations/translations";
import {AdyenOrderConnector} from "./core/connectors/adyen-order-connector.service";
import {OccAdyenOrderAdapter} from "./core/occ/adapters/occ-adyen-order.adapter";
import {
  ExpressCheckoutProductModule
} from "./product/components/express-checkout-product/express-checkout-product.module";
import {ExpressCheckoutCartModule} from "./cart/components/express-checkout-cart/express-checkout-cart.module";
import {AdyenExpressOrderService} from "./service/adyen-express-order.service";
import {AdyenCartService} from "./service/adyen-cart-service";
import { CheckoutDeliveryModesConnector,CheckoutDeliveryAddressConnector ,CheckoutDeliveryModesAdapter, CheckoutDeliveryAddressAdapter} from '@spartacus/checkout/base/core';
import { OccCheckoutDeliveryModesAdapter, OccCheckoutDeliveryAddressAdapter } from '@spartacus/checkout/base/occ';
import {PaypalExpressService} from "./express/service/paypal-express.service";
import { AdyenCheckoutDeliveryAddressConnector } from './core/connectors/adyen-checkout-delivery-address.connector';
import { OccAdyenCheckoutDeliveryAddressAdapter } from './core/occ/adapters/occ-adyen-checkout-delivery-address.adapter';
import {AdyenMyAccountModule} from "./adyen-my-account/adyen-my-account.module";
import {AdyenDataCollectionModule} from "./data-collection/adyen-data-collection.module";
import {OccAdyenCheckoutBillingAddressAdapter} from "./core/occ/adapters/occ-adyen-checkout-billing-address.adapter";
import {AdyenCheckoutBillingAddressConnector} from "./core/connectors/adyen-checkout-billing-address.connector";


@NgModule({
  imports: [
    CommonModule,
    CheckoutAdyenPaymentMethodModule,
    CheckoutAdyenEventModule,
    CheckoutAdyenRootModule,
    AdyenRedirectModule,
    ExpressCheckoutProductModule,
    ExpressCheckoutCartModule,
    AdyenMyAccountModule,
    AdyenDataCollectionModule
  ],
  providers: [
    provideDefaultConfig({
      backend: {
        occ: {
          endpoints: {
            orderDetail: 'users/${userId}/orders/${orderId}?fields=FULL',
            createDeliveryAddress:'users/${userId}/carts/${cartId}/addresses/delivery',
            deliveryModes:'users/${userId}/carts/${cartId}/deliverymodes',
            setDeliveryMode: 'users/${userId}/carts/${cartId}/deliverymode',
          }
        }
      }
    }),
    CheckoutAdyenConfigurationService,
    AdyenOrderService,
    AdyenExpressOrderService,
    PaypalExpressService,
    AdyenAddressService,
    OrderConnector,
    AdditionalDetailsConnector,
    AdyenOrderConnector,
    AdyenCheckoutDeliveryAddressConnector,
    AdyenCheckoutBillingAddressConnector,
    OccAdyenCheckoutDeliveryAddressAdapter,
    OccAdyenCheckoutBillingAddressAdapter,
    AdyenCartService,
    CheckoutDeliveryModesConnector,
    {
      provide: CheckoutDeliveryModesAdapter,
      useClass: OccCheckoutDeliveryModesAdapter,
    },
    CheckoutDeliveryAddressConnector,
    {
      provide: CheckoutDeliveryAddressAdapter,
      useClass: OccCheckoutDeliveryAddressAdapter,
    },
    {
      provide: OrderAdapter,
      useClass: OccOrderAdapter,
    },
    {
      provide: OrderHistoryAdapter,
      useClass: OccOrderHistoryAdapter
    },
    OccAdyenOrderAdapter,
    OccAdditionalDetailsAdapter,
    OccCheckoutConfigAdapter,
    CheckoutAdyenEventListener,
    CheckoutConfigurationConnector,
    OrderHistoryConnector,
    provideConfig(<I18nConfig>{
      i18n: {
        resources: adyenCheckoutTranslations,
        chunks: adyenCheckoutTranslationChunksConfig,
      },
    })],
})
export class AdyenPaymentsModule {
}
