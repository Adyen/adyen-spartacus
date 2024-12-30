import {Injectable} from '@angular/core';
import {OccEndpointsService} from "@spartacus/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {AdyenConfigData, AdyenExpressConfigData} from "../../models/occ.config.models";

@Injectable()
export class OccCheckoutConfigAdapter {


  constructor(
    protected http: HttpClient,
    protected occEndpoints: OccEndpointsService,
  ) {
  }

  public getCheckoutConfiguration(userId: string, cartId: string): Observable<AdyenConfigData> {
    return this.http.get<AdyenConfigData>(this.getCheckoutConfigurationEndpoint(userId, cartId));
  }

  protected getCheckoutConfigurationEndpoint(
    userId: string,
    cartId: string,
  ): string {
    return this.occEndpoints.buildUrl('users/${userId}/carts/${cartId}/adyen/checkout-configuration', {
      urlParams: {
        userId,
        cartId,
      }
    })
  }

  public getExpressCheckoutPDPConfiguration(productCode: string, userId: string): Observable<AdyenExpressConfigData> {
    return this.http.get<AdyenExpressConfigData>(this.getExpressCheckoutPDPConfigurationEndpoint(productCode, userId));
  }

  protected getExpressCheckoutPDPConfigurationEndpoint(
    productCode: string,
    userId: string,
  ): string {
    return this.occEndpoints.buildUrl('users/${userId}/adyen/checkout-configuration/express/PDP/${productCode}', {
      urlParams: {
        userId,
        productCode
      }
    })
  }

  public getExpressCheckoutCartConfiguration(userId: string, cartId: string): Observable<AdyenExpressConfigData> {
    return this.http.get<AdyenExpressConfigData>(this.getExpressCheckoutCartConfigurationEndpoint(userId, cartId));
  }

  protected getExpressCheckoutCartConfigurationEndpoint(
    userId: string,
    cartId: string,
  ): string {
    return this.occEndpoints.buildUrl('users/${userId}/carts/${cartId}/adyen/checkout-configuration/express/cart', {
      urlParams: {
        userId,
        cartId,
      }
    })
  }
}
