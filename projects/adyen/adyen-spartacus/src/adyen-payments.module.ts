import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AdyenCheckoutModule} from "./components/checkout/adyen-checkout.module";
import {AdyenExpressCheckoutModule} from "./components/express/adyen-express-checkout.module";
import {AdyenDataCollectionModule} from "./components/data-collection/adyen-data-collection.module";

/**
 * @deprecated Wersja główna modułu Adyen jest przestarzała. Używaj wydzielonych modułów feature (AdyenCheckoutModule, AdyenExpressCheckoutModule, AdyenDataCollectionModule, AdyenMyAccountModule).
 */
@NgModule({
  imports: [
    CommonModule,
    AdyenCheckoutModule,
    AdyenExpressCheckoutModule,
    AdyenDataCollectionModule
  ],
  exports: [
    AdyenCheckoutModule,
    AdyenExpressCheckoutModule,
    AdyenDataCollectionModule
  ]
})
export class AdyenPaymentsModule {
}
