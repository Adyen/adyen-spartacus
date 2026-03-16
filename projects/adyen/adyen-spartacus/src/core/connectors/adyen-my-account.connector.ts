import { Injectable } from "@angular/core";
import {OccAdyenMyAccountAdapter} from "../occ/adapters/occ-adyen-my-account.adapter";
import {StoredPaymentMethodResource, ZeroAuthRequestBody, ZeroAuthResponse} from "../models/occ.my-account.models";
import { Observable } from "rxjs";

@Injectable()
export class AdyenMyAccountConnector {
  constructor(protected adapter: OccAdyenMyAccountAdapter) {}

  getStoredCards(userId: string): Observable<StoredPaymentMethodResource[]>  {
    return this.adapter.getStoredCards(userId);
  }

  removeStoredCard(userId: string, cardId: string): Observable<Object> {
    return this.adapter.removeStoredCard(userId, cardId);
  }

  zeroAuth(requestBody: ZeroAuthRequestBody): Observable<ZeroAuthResponse> {
    return this.adapter.zeroAuth(requestBody);
  }
}
