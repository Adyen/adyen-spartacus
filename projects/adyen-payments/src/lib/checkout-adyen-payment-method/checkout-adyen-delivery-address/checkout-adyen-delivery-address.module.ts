import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {CartValidationGuard} from '@spartacus/cart/base/core';
import {CmsConfig, I18nModule, provideDefaultConfig} from '@spartacus/core';
import {CardModule, SpinnerModule} from '@spartacus/storefront';
import {AddressFormModule} from '@spartacus/user/profile/components';
import {AdyenCheckoutAdyenDeliveryAddressComponent} from "./adyen-checkout-adyen-delivery-address.component";
import {CartNotEmptyGuard, CheckoutAuthGuard} from '@spartacus/checkout/base/components';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    AddressFormModule,
    CardModule,
    SpinnerModule,
    I18nModule,
  ],
  providers: [
    provideDefaultConfig(<CmsConfig>{
      cmsComponents: {
        CheckoutDeliveryAddress: {
          component: AdyenCheckoutAdyenDeliveryAddressComponent,
          guards: [CheckoutAuthGuard, CartNotEmptyGuard, CartValidationGuard],
        },
      },
    }),
  ],
  declarations: [AdyenCheckoutAdyenDeliveryAddressComponent],
  exports: [AdyenCheckoutAdyenDeliveryAddressComponent],
})
export class AdyenCheckoutDeliveryAddressModule {
}
