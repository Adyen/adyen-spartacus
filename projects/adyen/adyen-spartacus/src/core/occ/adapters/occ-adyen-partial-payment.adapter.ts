import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OccEndpointsService } from '@spartacus/core';
import { Observable } from 'rxjs';
import {
  GiftCardBalanceRequest,
  GiftCardBalanceResponse,
  PartialPaymentOrderRequest,
  PartialPaymentOrderResponse
} from '../../models/occ.order.models';
import { AdyenPartialPaymentConnector } from '../../connectors/adyen-partial-payment.connector';

@Injectable()
export class OccAdyenPartialPaymentAdapter extends AdyenPartialPaymentConnector {

  constructor(
    protected http: HttpClient,
    protected occEndpoints: OccEndpointsService
  ) {
    super();
  }

  /**
   * Check gift card balance
   */
  checkGiftCardBalance(
    userId: string,
    cartId: string,
    request: GiftCardBalanceRequest
  ): Observable<GiftCardBalanceResponse> {
    return this.http.post<GiftCardBalanceResponse>(
      this.getGiftCardBalanceEndpoint(userId, cartId),
      request
    );
  }

  /**
   * Create partial payment order
   */
  createPartialPaymentOrder(
    userId: string,
    cartId: string,
    request: PartialPaymentOrderRequest
  ): Observable<PartialPaymentOrderResponse> {
    return this.http.post<PartialPaymentOrderResponse>(
      this.getPartialPaymentOrderEndpoint(userId, cartId),
      request
    );
  }

  /**
   * Get gift card balance endpoint URL
   */
  protected getGiftCardBalanceEndpoint(userId: string, cartId: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/carts/${cartId}/adyen/giftcard/balance', {
      urlParams: {
        userId,
        cartId,
      }
    });
  }

  /**
   * Get partial payment order endpoint URL
   */
  protected getPartialPaymentOrderEndpoint(userId: string, cartId: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/carts/${cartId}/adyen/orders/partial-payment', {
      urlParams: {
        userId,
        cartId,
      }
    });
  }
}
