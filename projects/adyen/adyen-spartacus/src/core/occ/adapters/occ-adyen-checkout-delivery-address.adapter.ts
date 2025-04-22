import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Address, OccEndpointsService } from '@spartacus/core';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class OccAdyenCheckoutDeliveryAddressAdapter {
  constructor(
    protected http: HttpClient,
    protected occEndpoints: OccEndpointsService
  ) {}

  /**
   * Creates a delivery address for the specified cart
   *
   * @param userId The user ID for which to create the address
   * @param cartId The cart ID for which to create the address
   * @param address The address data to be saved
   * @returns An observable with the created Address
   */
  createAddress(userId: string, cartId: string, address: Address): Observable<Address> {
    const url = this.occEndpoints.buildUrl('users/${userId}/carts/${cartId}/adyen/addresses/delivery', {
      urlParams: { userId, cartId },
    });

    return this.http.post<Address>(url, address);
  }
}