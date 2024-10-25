import {CheckoutAdyenEventListener} from "./checkout-adyen-event.listener";
import {NgModule} from "@angular/core";

@NgModule({})
export class CheckoutAdyenEventModule{
    constructor(
      _checkoutAdyenEventListener: CheckoutAdyenEventListener
    ) {}
}
