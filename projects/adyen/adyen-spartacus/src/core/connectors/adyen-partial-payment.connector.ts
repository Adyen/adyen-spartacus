import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  GiftCardBalanceRequest,
  GiftCardBalanceResponse,
  PartialPaymentOrderRequest,
  PartialPaymentOrderResponse
} from '../models/occ.order.models';

@Injectable({
  providedIn: 'root'
})
export abstract class AdyenPartialPaymentConnector {
  /**
   * Check gift card balance
   */
  abstract checkGiftCardBalance(
    userId: string,
    cartId: string,
    request: GiftCardBalanceRequest
  ): Observable<GiftCardBalanceResponse>;

  /**
   * Create partial payment order
   */
  abstract createPartialPaymentOrder(
    userId: string,
    cartId: string,
    request: PartialPaymentOrderRequest
  ): Observable<PartialPaymentOrderResponse>;
}