import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApplePayExpressRequest,
  GooglePayExpressRequest,
  PlaceOrderRequest,
  PlaceOrderResponse
} from "../models/occ.order.models";
import {OccAdyenOrderAdapter} from "../occ/adapters/occ-adyen-order.adapter";

@Injectable()
export class AdyenOrderConnector {
  constructor(protected adapter: OccAdyenOrderAdapter) {}

  placeOrder(userId: string, cartId: string, orderData: PlaceOrderRequest): Observable<PlaceOrderResponse> {
    return this.adapter.placeOrder(userId, cartId, orderData);
  }

  paymentCanceled(userId: string, cartId: string, orderCode: string): Observable<void> {
    return this.adapter.cancelPayment(userId, cartId, orderCode);
  }

  placeGoogleExpressOrderCart(userId: string, cartId: string, request: GooglePayExpressRequest, isPDP: boolean): Observable<PlaceOrderResponse> {
    return this.adapter.placeGoogleExpressOrderCart(userId, cartId, request, isPDP);
  }

  placeAppleExpressOrder(userId: string, cartId: string, request: ApplePayExpressRequest, isPDP: boolean): Observable<PlaceOrderResponse> {
    return this.adapter.placeAppleExpressOrder(userId, cartId, request, isPDP);
  }
}
