import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {OccEndpointsService} from '@spartacus/core';
import {Observable} from 'rxjs';
import {
  ApplePayExpressRequest,
  GooglePayExpressCartRequest,
  PlaceOrderRequest,
  PlaceOrderResponse
} from "../../models/occ.order.models";

@Injectable()
export class OccAdyenOrderAdapter {

  constructor(
    protected http: HttpClient,
    protected occEndpoints: OccEndpointsService
  ) {
  }

  public placeOrder(userId: string, cartId: string, orderData: PlaceOrderRequest): Observable<PlaceOrderResponse> {
    return this.http.post<PlaceOrderResponse>(this.getPlaceOrderEndpoint(userId, cartId), orderData);
  }

  protected getPlaceOrderEndpoint(userId: string, cartId: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/carts/${cartId}/adyen/place-order', {
      urlParams: {
        userId,
        cartId,
      }
    });
  }

  public cancelPayment(userId: string, cartId: string, orderCode: string): Observable<void> {
    return this.http.post<void>(this.getPaymentCanceledEndpoint(userId, cartId, orderCode), {})
  }

  protected getPaymentCanceledEndpoint(userId: string, cartId: string, orderCode: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/adyen/payment-canceled/${orderCode}', {
      urlParams: {
        userId,
        cartId,
        orderCode
      }
    });
  }

  public placeGoogleExpressOrderCart(userId: string, cartId: string, orderData: GooglePayExpressCartRequest): Observable<PlaceOrderResponse> {
    return this.http.post<PlaceOrderResponse>(orderData.productCode  ? this.getPlaceGoogleExpressOrderEndpointProduct(userId, cartId) : this.getPlaceGoogleExpressOrderEndpointCart(userId, cartId), orderData);
  }

  protected getPlaceGoogleExpressOrderEndpointCart(userId: string, cartId: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/carts/${cartId}/adyen/express-checkout/google/cart', {
      urlParams: {
        userId,
        cartId,
      }
    });
  }

  protected getPlaceGoogleExpressOrderEndpointProduct(userId: string, cartId: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/carts/${cartId}/adyen/express-checkout/google/PDP', {
      urlParams: {
        userId,
        cartId,
      }
    });
  }

  public placeAppleExpressOrder(userId: string, cartId: string, orderData: ApplePayExpressRequest): Observable<PlaceOrderResponse> {
    return this.http.post<PlaceOrderResponse>(orderData.productCode  ? this.getPlaceAppleExpressOrderEndpointProduct(userId, cartId) : this.getPlaceAppleExpressOrderEndpointCart(userId, cartId), orderData);
  }

  protected getPlaceAppleExpressOrderEndpointCart(userId: string, cartId: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/carts/${cartId}/adyen/express-checkout/apple/cart', {
      urlParams: {
        userId,
        cartId,
      }
    });
  }

  protected getPlaceAppleExpressOrderEndpointProduct(userId: string, cartId: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/carts/${cartId}/adyen/express-checkout/apple/PDP', {
      urlParams: {
        userId,
        cartId,
      }
    });
  }

}
