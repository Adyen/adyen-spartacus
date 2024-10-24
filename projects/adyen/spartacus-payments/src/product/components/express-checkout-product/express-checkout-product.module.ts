import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ConfigModule} from '@spartacus/core';
import {ExpressCheckoutProductComponent} from "./express-checkout-product.component";


@NgModule({
  imports: [
    CommonModule,
    ConfigModule.withConfig({
      cmsComponents: {
        AdyenSpaExpressCheckoutProductPageComponent: {
          component: ExpressCheckoutProductComponent
        }
      }
    })
  ],
  declarations: [ExpressCheckoutProductComponent],
  exports: [ExpressCheckoutProductComponent]
})
export class ExpressCheckoutProductModule {
}
