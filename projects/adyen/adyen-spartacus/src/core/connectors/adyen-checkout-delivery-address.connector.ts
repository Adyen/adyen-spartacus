import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Address } from '@spartacus/core';
import { OccAdyenCheckoutDeliveryAddressAdapter } from '../occ/adapters/occ-adyen-checkout-delivery-address.adapter';

@Injectable()
export class AdyenCheckoutDeliveryAddressConnector {
  constructor(protected adapter: OccAdyenCheckoutDeliveryAddressAdapter) {}

  /**
   * Creates a delivery address for the specified cart
   *
   * @param userId The user ID for which to create the address
   * @param cartId The cart ID for which to create the address
   * @param address The address data to be saved
   * @returns An observable with the created Address
   */
  createAddress(userId: string, cartId: string, address: Address): Observable<Address> {
    return this.adapter.createAddress(userId, cartId, address);
  }
}