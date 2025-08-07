import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {OccEndpointsService} from "@spartacus/core";
import {Observable} from "rxjs";
import {BillingAddress} from "../../models/occ.order.models";

@Injectable()
export class OccAdyenCheckoutBillingAddressAdapter {
  constructor(
    protected http: HttpClient,
    protected occEndpoints: OccEndpointsService
  ) {}


  createBillingAddress(userId: string, address: BillingAddress): Observable<BillingAddress> {
    const url = this.occEndpoints.buildUrl('users/${userId}/adyen/addresses/billing', {
      urlParams: { userId },
    });

    return this.http.post<BillingAddress>(url, address);
  }
}
