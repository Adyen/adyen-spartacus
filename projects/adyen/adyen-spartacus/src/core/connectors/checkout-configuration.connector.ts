import {Injectable} from "@angular/core";
import {OccCheckoutConfigAdapter} from "../occ/adapters/occ-checkout-config.adapter";
import {AdyenConfigData, AdyenExpressConfigData} from "../models/occ.config.models";
import {Observable} from "rxjs";

@Injectable()
export class CheckoutConfigurationConnector {
  constructor(protected adapter: OccCheckoutConfigAdapter) {}

  getCheckoutConfiguration(userId: string, cartId: string): Observable<AdyenConfigData> {
    return this.adapter.getCheckoutConfiguration(userId, cartId);
  }

  getExpressCheckoutPDPConfiguration(productCode: string, userId: string): Observable<AdyenExpressConfigData> {
    return this.adapter.getExpressCheckoutPDPConfiguration(productCode, userId);
  }

  getExpressCheckoutCartConfiguration(userId: string, cartId: string): Observable<AdyenExpressConfigData> {
    return this.adapter.getExpressCheckoutCartConfiguration(userId, cartId);
  }
}
