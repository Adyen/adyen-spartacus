import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {OccEndpointsService} from "@spartacus/core";
import {AdyenDataCollectionConfig} from "../../models/occ.config.models";
import {Observable} from "rxjs";


@Injectable()
export class OccDataCollectionConfigAdapter {
  constructor(
    protected http: HttpClient,
    protected occEndpoints: OccEndpointsService,
  ) {
  }

  public getDataCollectionConfiguration(userId: string, cartId: string): Observable<AdyenDataCollectionConfig> {
    return this.http.get<AdyenDataCollectionConfig>(this.getDataCollectionConfigurationEndpoint(userId, cartId));
  }

  protected getDataCollectionConfigurationEndpoint(
    userId: string,
    cartId: string,
  ): string {
    return this.occEndpoints.buildUrl('users/${userId}/carts/${cartId}/adyen/data-collection-configuration', {
      urlParams: {
        userId,
        cartId,
      }
    })
  }

}
