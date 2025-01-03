import {Injectable} from "@angular/core";
import {combineLatest, Observable, switchMap} from "rxjs";
import {AdyenConfigData, AdyenExpressConfigData} from "../core/models/occ.config.models";
import {LoginEvent, LogoutEvent, Query, QueryNotifier, QueryService, QueryState, UserIdService} from "@spartacus/core";
import {filter, map, take} from "rxjs/operators";
import {ActiveCartFacade} from "@spartacus/cart/base/root";
import {CheckoutAdyenConfigurationReloadEvent} from "../events/checkout-adyen.events";
import {CheckoutConfigurationConnector} from "../core/connectors/checkout-configuration.connector";
import {AdyenBaseService} from "./adyen-base.service";
import {CurrentProductService} from "@spartacus/storefront";


@Injectable()
export class CheckoutAdyenConfigurationService extends AdyenBaseService {
  constructor(
    protected override activeCartFacade: ActiveCartFacade,
    protected override userIdService: UserIdService,
    protected queryService: QueryService,
    protected checkoutConfigurationConnector: CheckoutConfigurationConnector,
    protected currentProductService: CurrentProductService,
  ) {
    super(userIdService, activeCartFacade);
  }

  protected checkoutConfiguration: Query<AdyenConfigData> = this.queryService.create(
    () => this.checkoutPreconditions().pipe(
      switchMap(([userId, cartId]) => this.checkoutConfigurationConnector.getCheckoutConfiguration(userId, cartId))
    ), {
      reloadOn: this.getCheckoutAdyenConfigurationLoadedEvents(),
      resetOn: [LoginEvent, LogoutEvent]
    }
  );

  protected getCheckoutAdyenConfigurationLoadedEvents(): QueryNotifier[] {
    return [CheckoutAdyenConfigurationReloadEvent];
  }

  getCheckoutConfigurationState(): Observable<QueryState<AdyenConfigData>> {
    return this.checkoutConfiguration.getState();
  }

  fetchCheckoutConfiguration(userId: string, cartId: string): Observable<AdyenConfigData> {
    return this.checkoutConfigurationConnector.getCheckoutConfiguration(userId, cartId);
  }


  fetchExpressCheckoutPDPConfiguration(): Observable<AdyenExpressConfigData> {
    return this.checkoutPreconditionsUserAndProductCode().pipe(
      switchMap(([userId, productCode]) => this.checkoutConfigurationConnector.getExpressCheckoutPDPConfiguration(productCode, userId))
    )
  }

  fetchExpressCheckoutCartConfiguration(): Observable<AdyenExpressConfigData> {
    return this.checkoutPreconditions().pipe(
      switchMap(([userId, cartId])=> this.checkoutConfigurationConnector.getExpressCheckoutCartConfiguration(userId, cartId))
    )
  }

  protected checkoutPreconditionsUserAndProductCode(): Observable<[string, string]> {
    return combineLatest([
      this.checkoutPreconditions(),
      this.currentProductService.getProduct()
    ]).pipe(
      filter(([[userId], product]) => product != null),
      take(1),
      map(([[userId], product]) => {
        return [userId, product!.code!]
      })
    )
  }

}
