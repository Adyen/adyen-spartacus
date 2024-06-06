import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {CheckoutAdyenPaymentMethodModule} from "./checkout-adyen-payment-method/checkout-adyen-payment-method.module";
import {CheckoutAdyenRootModule} from "./root/checkout-adyen-root.module";


@NgModule({
  imports: [
    CommonModule,
    CheckoutAdyenPaymentMethodModule,
    CheckoutAdyenRootModule
  ]
})
export class AdyenPaymentsModule { }
