import { Injectable } from "@angular/core";
import {OccAdyenMyAccountAdapter} from "../occ/adapters/occ-adyen-my-account.adapter";
import {AdyenRecurringDetail} from "../models/occ.my-account.models";
import { Observable } from "rxjs";

@Injectable()
export class AdyenMyAccountConnector {
  constructor(protected adapter: OccAdyenMyAccountAdapter) {}

  getStoredCards(userId: string): Observable<AdyenRecurringDetail[]>  {
    return this.adapter.getStoredCards(userId);
  }

  removeStoredCard(userId: string, cardId: string): Observable<Object> {
    return this.adapter.removeStoredCard(userId, cardId);
  }

}
