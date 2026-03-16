import { Injectable } from "@angular/core";
import {AdyenBaseService} from "./adyen-base.service";
import { ActiveCartFacade } from "@spartacus/cart/base/root";
import { UserIdService } from "@spartacus/core";
import { Observable, switchMap } from "rxjs";
import {AdyenMyAccountConnector} from "../core/connectors/adyen-my-account.connector";
import {StoredPaymentMethodResource, ZeroAuthRequestBody, ZeroAuthResponse} from "../core/models/occ.my-account.models";
import { CheckoutConfigurationConnector } from "../core/connectors/checkout-configuration.connector";
import { AdyenConfigData } from "../core/models/occ.config.models";
import { AdditionalDetailsConnector } from "../core/connectors/additional-details.connector";
import { PlaceOrderResponse } from "../core/models/occ.order.models";

@Injectable()
export class AdyenMyAccountService extends AdyenBaseService{
  constructor(protected override activeCartFacade: ActiveCartFacade,
              protected override userIdService: UserIdService,
              protected adyenMyAccountConnector: AdyenMyAccountConnector,
              protected checkoutConfigurationConnector: CheckoutConfigurationConnector,
              protected additionalDetailsConnector: AdditionalDetailsConnector) {
    super(userIdService, activeCartFacade);
  }

getStoredCards(): Observable<StoredPaymentMethodResource[]> {
  return this.checkoutPreconditions().pipe(
    switchMap(([userId]) => 
      this.adyenMyAccountConnector.getStoredCards(userId))
  )
}

  removeStoredCard(cardId: string): Observable<Object> {
return this.checkoutPreconditions().pipe(
    switchMap(([userId]) => 
      this.adyenMyAccountConnector.removeStoredCard(userId, cardId))
  )  }

  zeroAuth(requestBody: ZeroAuthRequestBody): Observable<ZeroAuthResponse> {
    return this.adyenMyAccountConnector.zeroAuth(requestBody);
  }

  getCheckoutConfiguration(userId: string): Observable<AdyenConfigData> {
    return this.checkoutConfigurationConnector.getMyAccountCheckoutConfiguration(userId);
  }

}
