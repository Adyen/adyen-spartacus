import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OccPlaceOrderAdapter } from '../occ/adapters/occ-placeorder.adapter';
import {PlaceOrderRequest, PlaceOrderResponse} from "../models/occ.order.models";
import {OccAdditionalDetailsAdapter} from "../occ/adapters/occ-additionaldetails.adapter";

@Injectable()
export class AdditionalDetailsConnector {
  constructor(protected adapter: OccAdditionalDetailsAdapter) {}

  sendAdditionalDetails(userId: string, cartId: string, orderData: PlaceOrderRequest): Observable<PlaceOrderResponse> {
    return this.adapter.sendAdditionalDetails(userId, cartId, orderData);
  }
}
