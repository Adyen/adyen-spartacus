import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OccPlaceOrderAdapter } from '../occ/adapters/occ-placeorder.adapter';
import {PlaceOrderRequest, PlaceOrderResponse} from "../models/occ.order.models";

@Injectable()
export class PlaceOrderConnector {
  constructor(protected adapter: OccPlaceOrderAdapter) {}

  placeOrder(userId: string, cartId: string, orderData: PlaceOrderRequest): Observable<PlaceOrderResponse> {
    return this.adapter.placeOrder(userId, cartId, orderData);
  }
}
