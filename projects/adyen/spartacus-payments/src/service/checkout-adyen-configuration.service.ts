import {Injectable} from "@angular/core";
import {combineLatest, Observable, switchMap} from "rxjs";
import {AdyenConfigData} from "../core/models/occ.config.models";
import {LoginEvent, LogoutEvent, OCC_USER_ID_ANONYMOUS, Query, QueryNotifier, QueryService, QueryState, UserIdService} from "@spartacus/core";
import {filter, map, take} from "rxjs/operators";
import {ActiveCartFacade} from "@spartacus/cart/base/root";
import {CheckoutAdyenConfigurationReloadEvent} from "../events/checkout-adyen.events";
import {CheckoutConfigurationConnector} from "../core/connectors/checkout-configuration.connector";
import {AdyenBaseService} from "./adyen-base.service";


@Injectable()
export class CheckoutAdyenConfigurationService extends AdyenBaseService {
  constructor(
    protected override activeCartFacade: ActiveCartFacade,
    protected override userIdService: UserIdService,
    protected queryService: QueryService,
    protected checkoutConfigurationConnector: CheckoutConfigurationConnector,
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
  
}
