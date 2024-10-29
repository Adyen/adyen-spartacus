import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ConfigModule} from '@spartacus/core';
import {ExpressCheckoutCartComponent} from "./express-checkout-cart.component";
import {GoogleExpressPaymentComponent} from "../../../express/google-express-payment/google-express-payment.component";


@NgModule({
  imports: [
    CommonModule,
    GoogleExpressPaymentComponent,
    ConfigModule.withConfig({
      cmsComponents: {
        AdyenSpaExpressCheckoutCartPageComponent: {
          component: ExpressCheckoutCartComponent
        }
      }
    })
  ],
  declarations: [ExpressCheckoutCartComponent],
  exports: [ExpressCheckoutCartComponent]
})
export class ExpressCheckoutCartModule {
}
