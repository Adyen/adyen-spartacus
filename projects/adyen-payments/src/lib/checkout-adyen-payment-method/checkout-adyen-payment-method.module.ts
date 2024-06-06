import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {CheckoutAdyenPaymentMethodComponent} from "./checkout-adyen-payment-method.component";
import {CartNotEmptyGuard, CheckoutAuthGuard} from "@spartacus/checkout/base/components";
import {CmsConfig, I18nModule, provideDefaultConfig} from "@spartacus/core";
import {RouterModule} from "@angular/router";
import {CardModule, SpinnerModule} from "@spartacus/storefront";
import {CheckoutAdyenPaymentFormModule} from "./checkout-adyen-payment-form/checkout-adyen-payment-form.module";



@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    CheckoutAdyenPaymentFormModule,
    CardModule,
    SpinnerModule,
    I18nModule,
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
