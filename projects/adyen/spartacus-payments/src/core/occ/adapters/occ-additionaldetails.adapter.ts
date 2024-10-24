import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OccEndpointsService } from '@spartacus/core';
import { Observable } from 'rxjs';
import {PlaceOrderRequest, PlaceOrderResponse} from "../../models/occ.order.models";

@Injectable()
export class OccAdditionalDetailsAdapter {

  constructor(
    protected http: HttpClient,
    protected occEndpoints: OccEndpointsService
  ) {}

  public sendAdditionalDetails(userId: string, cartId: string, details: any): Observable<PlaceOrderResponse> {
    return this.http.post<PlaceOrderResponse>(this.getAdditionalDetailsEndpoint(userId, cartId), details);
  }

  protected getAdditionalDetailsEndpoint(userId: string, cartId: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/carts/${cartId}/adyen/additional-details', {
      urlParams: {
        userId,
        cartId,
      }
    });
  }
}
