import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ConfigModule} from '@spartacus/core';
import {ExpressCheckoutCartComponent} from "./express-checkout-cart.component";
import {GoogleExpressPaymentComponent} from "../../../express/google-express-payment/google-express-payment.component";
import {AppleExpressPaymentComponent} from "../../../express/apple-express-payment/apple-express-payment.component";
import {PaypalExpressPaymentComponent} from "../../../express/paypal-express-payment/paypal-express-payment.component";


@NgModule({
    imports: [
        CommonModule,
        GoogleExpressPaymentComponent,
        PaypalExpressPaymentComponent,
        ConfigModule.withConfig({
            cmsComponents: {
                AdyenSpaExpressCheckoutCartPageComponent: {
                    component: ExpressCheckoutCartComponent
                }
            }
        }),
        AppleExpressPaymentComponent
    ],
  declarations: [ExpressCheckoutCartComponent],
  exports: [ExpressCheckoutCartComponent]
})
export class ExpressCheckoutCartModule {
}
