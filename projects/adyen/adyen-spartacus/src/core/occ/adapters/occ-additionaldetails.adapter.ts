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

  public sendAdditionalDetails(userId: string, details: any): Observable<PlaceOrderResponse> {
    return this.http.post<PlaceOrderResponse>(this.getAdditionalDetailsEndpoint(userId), details);
  }

  protected getAdditionalDetailsEndpoint(userId: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/adyen/additional-details', {
      urlParams: {
        userId,
      }
    });
  }
}
