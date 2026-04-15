import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ExpressCheckoutProductModule
} from "../product/components/express-checkout-product/express-checkout-product.module";
import {ExpressCheckoutCartModule} from "../cart/components/express-checkout-cart/express-checkout-cart.module";
import {AdyenExpressOrderService} from "../service/adyen-express-order.service";
import {AdyenCartService} from "../service/adyen-cart-service";
import {PaypalExpressService} from "./service/paypal-express.service";

@NgModule({
  imports: [
    CommonModule,
    ExpressCheckoutProductModule,
    ExpressCheckoutCartModule
  ],
  providers: [
    AdyenExpressOrderService,
    PaypalExpressService,
    AdyenCartService
  ]
})
export class AdyenExpressCheckoutModule {}
