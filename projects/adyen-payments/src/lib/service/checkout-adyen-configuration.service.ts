import {Injectable} from "@angular/core";
import {combineLatest, Observable, switchMap} from "rxjs";
import {AdyenConfigData} from "../core/models/occ.config.models";
import {OCC_USER_ID_ANONYMOUS, Query, QueryNotifier, QueryService, QueryState, UserIdService} from "@spartacus/core";
import {filter, map, take} from "rxjs/operators";
import {ActiveCartFacade} from "@spartacus/cart/base/root";
import {CheckoutAdyenConfigurationReloadEvent} from "../events/checkout-adyen.events";
import {CheckoutConfigurationConnector} from "../core/connectors/checkout-configuration.connector";


@Injectable()
export class CheckoutAdyenConfigurationService {
  constructor(
    protected activeCartFacade: ActiveCartFacade,
    protected userIdService: UserIdService,
    protected queryService: QueryService,
    protected checkoutConfigurationConnector: CheckoutConfigurationConnector,
  ) {}

  protected checkoutConfiguration: Query<AdyenConfigData> = this.queryService.create(
    () => this.checkoutPreconditions().pipe(
      switchMap(([userId, cartId]) => this.checkoutConfigurationConnector.getCheckoutConfiguration(userId, cartId))
    ), {
      reloadOn: this.getCheckoutAdyenConfigurationLoadedEvents(),
    }
  );

  protected getCheckoutAdyenConfigurationLoadedEvents(): QueryNotifier[] {
    return [CheckoutAdyenConfigurationReloadEvent];
  }

  protected checkoutPreconditions(): Observable<[string, string]> {
    return combineLatest([
      this.userIdService.takeUserId(),
      this.activeCartFacade.takeActiveCartId(),
      this.activeCartFacade.isGuestCart(),
    ]).pipe(
      take(1),
      map(([userId, cartId, isGuestCart]) => {
        if (
          !userId ||
          !cartId ||
          (userId === OCC_USER_ID_ANONYMOUS && !isGuestCart)
        ) {
          throw new Error('Checkout conditions not met');
        }
        return [userId, cartId];
      })
    );
  }

  getCheckoutConfigurationState(): Observable<QueryState<AdyenConfigData>> {
    return this.checkoutConfiguration.getState();
  }

  getCheckoutConfiguration(): Observable<AdyenConfigData | undefined> {
    return this.getCheckoutConfigurationState().pipe(
      filter((state) => !state.loading),
      map((state) => state.data)
    );
  }
}
