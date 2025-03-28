import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApplePayExpressRequest,
  GooglePayExpressRequest, PayPalExpressRequest, PaypalUpdateOrderRequest, PaypalUpdateOrderResponse,
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

  placePayPalExpressOrder(userId: string, cartId: string, request: PayPalExpressRequest, isPDP: boolean): Observable<PlaceOrderResponse> {
    return this.adapter.placePayPalExpressOrder(userId, cartId, request, isPDP);
  }

  handlePayPalSubmit(userId: string, cartId: string, request: PayPalExpressRequest){
    return this.adapter.payPalSubmit(userId, cartId, request);
  }

  updatePaypalOrder(userId: string, cartId: string,  request: PaypalUpdateOrderRequest): Observable<PaypalUpdateOrderResponse> {
    return this.adapter.updatePaypalOrder(userId, cartId, request);
  }
}
