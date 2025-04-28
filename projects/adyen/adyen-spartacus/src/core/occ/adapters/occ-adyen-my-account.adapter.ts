import { Injectable } from "@angular/core";
import {HttpClient} from '@angular/common/http';
import { OccEndpointsService } from "@spartacus/core";
import {AdyenRecurringDetail} from "../../models/occ.my-account.models";
import { Observable } from "rxjs";

@Injectable()
export class OccAdyenMyAccountAdapter {
  constructor(
    protected http: HttpClient,
    protected occEndpoints: OccEndpointsService
  ) {
  }

  public getStoredCards(userId: string): Observable<AdyenRecurringDetail[]> {
    return this.http.get<AdyenRecurringDetail[]>(this.getStoredCardsEndpoint(userId))
  }

  protected getStoredCardsEndpoint(userId: string) {
    return this.occEndpoints.buildUrl('users/${userId}/adyen/stored-cards', {
      urlParams:{
        userId
      }
    })
  }

  public removeStoredCard(userId: string, cardId: string): Observable<Object> {
    return this.http.delete(this.getRemoveStoredCardEndpoint(userId, cardId))
  }

  protected getRemoveStoredCardEndpoint(userId: string, cardId: string){
    return this.occEndpoints.buildUrl('users/${userId}/adyen/stored-cards/${cardId}', {
      urlParams:{
        userId,
        cardId
      }
    })
  }

}
