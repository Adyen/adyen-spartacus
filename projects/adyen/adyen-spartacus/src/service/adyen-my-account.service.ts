import { Injectable } from "@angular/core";
import {AdyenBaseService} from "./adyen-base.service";
import { ActiveCartFacade } from "@spartacus/cart/base/root";
import { UserIdService } from "@spartacus/core";
import {Observable, switchMap } from "rxjs";
import {AdyenMyAccountConnector} from "../core/connectors/adyen-my-account.connector";
import {AdyenRecurringDetail} from "../core/models/occ.my-account.models";

@Injectable()
export class AdyenMyAccountService extends AdyenBaseService{
  constructor(protected override activeCartFacade: ActiveCartFacade,
              protected override userIdService: UserIdService,
              protected adyenMyAccountConnector: AdyenMyAccountConnector) {
    super(userIdService, activeCartFacade);
  }

  getStoredCards(): Observable<AdyenRecurringDetail[]> {
    return this.checkoutPreconditions().pipe(
      switchMap(([userId])=>
      this.adyenMyAccountConnector.getStoredCards(userId))
    )
  }

  removeStoredCard(cardId: string): Observable<Object> {
    return this.checkoutPreconditions().pipe(
      switchMap(([userId])=>
        this.adyenMyAccountConnector.removeStoredCard(userId, cardId))
    )
  }

}
