import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdyenCheckoutDeliveryAddressConnector } from './connectors/adyen-checkout-delivery-address.connector';
import { OccAdyenCheckoutDeliveryAddressAdapter } from './occ/adapters/occ-adyen-checkout-delivery-address.adapter';

@NgModule({
  imports: [CommonModule],
  providers: [
    AdyenCheckoutDeliveryAddressConnector,
    OccAdyenCheckoutDeliveryAddressAdapter,
  ]
})
export class AdyenCheckoutDeliveryAddressModule { }