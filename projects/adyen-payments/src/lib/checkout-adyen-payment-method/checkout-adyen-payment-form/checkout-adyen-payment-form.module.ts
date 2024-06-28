import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import {FeaturesConfigModule, I18nModule} from '@spartacus/core';
import {
  CardModule,
  FormErrorsModule,
  IconModule,
  NgSelectA11yModule,
  SpinnerModule,
} from '@spartacus/storefront';
import {CheckoutAdyenPaymentFormComponent} from "./checkout-adyen-payment-form.component";


@NgModule({
  imports: [
    NgSelectA11yModule,
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule,
    CardModule,
    I18nModule,
    IconModule,
    SpinnerModule,
    FormErrorsModule,
    FeaturesConfigModule,
  ],
  declarations: [CheckoutAdyenPaymentFormComponent],
  exports: [CheckoutAdyenPaymentFormComponent],
})
export class CheckoutAdyenPaymentFormModule {}
