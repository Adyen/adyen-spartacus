import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {PlaceOrderRequest, PlaceOrderResponse} from "../models/occ.order.models";
import {OccAdditionalDetailsAdapter} from "../occ/adapters/occ-additionaldetails.adapter";

@Injectable()
export class AdditionalDetailsConnector {
  constructor(protected adapter: OccAdditionalDetailsAdapter) {}

  sendAdditionalDetails(userId: string, orderData: PlaceOrderRequest): Observable<PlaceOrderResponse> {
    return this.adapter.sendAdditionalDetails(userId, orderData);
  }
}
