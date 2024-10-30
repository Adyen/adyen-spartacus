import {inject, Injectable} from '@angular/core';
import {ConverterService, LoggerService, OccEndpointsService} from "@spartacus/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {AdyenConfigData} from "../../models/occ.config.models";

@Injectable()
export class OccCheckoutConfigAdapter {

  protected logger = inject(LoggerService);


  constructor(
    protected http: HttpClient,
    protected occEndpoints: OccEndpointsService,
    protected converter: ConverterService
  ) {
  }

  public getCheckoutConfiguration(userId: string, cartId: string):Observable<AdyenConfigData> {
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
}
