import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Address} from '@spartacus/core';
import {OccAdyenCheckoutBillingAddressAdapter} from "../occ/adapters/occ-adyen-checkout-billing-address.adapter";
import {BillingAddress} from "../models/occ.order.models";

@Injectable()
export class AdyenCheckoutBillingAddressConnector {
  constructor(protected adapter: OccAdyenCheckoutBillingAddressAdapter) {}

  createBillingAddress(userId: string, address: Address): Observable<BillingAddress> {
    return this.adapter.createBillingAddress(userId, address);
  }
}
