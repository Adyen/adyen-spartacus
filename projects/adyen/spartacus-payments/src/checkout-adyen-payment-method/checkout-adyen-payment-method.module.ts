import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CheckoutAdyenPaymentMethodComponent} from "./checkout-adyen-payment-method.component";
import {CartNotEmptyGuard, CheckoutAuthGuard} from "@spartacus/checkout/base/components";
import {CmsConfig, I18nModule, provideDefaultConfig} from "@spartacus/core";
import {RouterModule} from "@angular/router";
import {CardModule, SpinnerModule} from "@spartacus/storefront";
import {
  AdyenCheckoutDeliveryAddressModule
} from "./checkout-adyen-delivery-address/checkout-adyen-delivery-address.module";


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    SpinnerModule,
    I18nModule,
    AdyenCheckoutDeliveryAddressModule
  ],
  providers: [
    provideDefaultConfig(<CmsConfig>{
      cmsComponents: {
        CheckoutAdyenPaymentDetails: {
          component: CheckoutAdyenPaymentMethodComponent,
          guards: [CheckoutAuthGuard, CartNotEmptyGuard],
        },
      },
    }),
  ],
  declarations: [CheckoutAdyenPaymentMethodComponent],
  exports: [CheckoutAdyenPaymentMethodComponent],
})
export class CheckoutAdyenPaymentMethodModule { }
