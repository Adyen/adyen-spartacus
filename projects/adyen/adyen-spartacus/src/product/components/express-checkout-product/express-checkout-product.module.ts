import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ConfigModule} from '@spartacus/core';
import {ExpressCheckoutProductComponent} from "./express-checkout-product.component";
import {GoogleExpressPaymentComponent} from "../../../express/google-express-payment/google-express-payment.component";
import {AppleExpressPaymentComponent} from "../../../express/apple-express-payment/apple-express-payment.component";
import {PaypalExpressPaymentComponent} from "../../../express/paypal-express-payment/paypal-express-payment.component";


@NgModule({
  imports: [
    CommonModule,
    ConfigModule.withConfig({
      cmsComponents: {
        AdyenSpaExpressCheckoutProductPageComponent: {
          component: ExpressCheckoutProductComponent
        }
      }
    }),
    GoogleExpressPaymentComponent,
    PaypalExpressPaymentComponent,
    AppleExpressPaymentComponent
  ],
  declarations: [ExpressCheckoutProductComponent],
  exports: [ExpressCheckoutProductComponent]
})
export class ExpressCheckoutProductModule {
}
