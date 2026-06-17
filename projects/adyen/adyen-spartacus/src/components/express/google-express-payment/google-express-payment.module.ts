import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CmsConfig, I18nModule, provideDefaultConfig} from "@spartacus/core";
import {RouterModule} from "@angular/router";
import {CartNotEmptyGuard, CheckoutAuthGuard} from "@spartacus/checkout/base/components";
import {CardModule, SpinnerModule} from "@spartacus/storefront";


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    SpinnerModule,
    I18nModule,
  ],
  declarations: []
})
export class GoogleExpressPaymentModule { }
