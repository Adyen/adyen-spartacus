import {Injectable} from "@angular/core";
import {AdyenBaseService} from "./adyen-base.service";
import {ActiveCartFacade} from "@spartacus/cart/base/root";
import {LoginEvent, LogoutEvent, Query, QueryService, QueryState, UserIdService} from "@spartacus/core";
import {DataCollectionConfigConnector} from "../core/connectors/data-collection-config.connector";
import {AdyenDataCollectionConfig} from "../core/models/occ.config.models";
import {Observable, filter, map, switchMap} from "rxjs";
import {CheckoutAdyenConfigurationReloadEvent} from "../events/checkout-adyen.events";

@Injectable()
export class AdyenDataCollectionConfigurationService extends AdyenBaseService {
  constructor(
    protected override activeCartFacade: ActiveCartFacade,
    protected override userIdService: UserIdService,
    protected queryService: QueryService,
    protected dataCollectionConfigConnector: DataCollectionConfigConnector,
  ) {
    super(userIdService, activeCartFacade);
  }

  protected dataCollectionConfiguration: Query<AdyenDataCollectionConfig> = this.queryService.create(
    () => this.checkoutPreconditions().pipe(
      switchMap(([userId, cartId]) => this.dataCollectionConfigConnector.getDataCollectionConfiguration(userId, cartId))
    ), {
      reloadOn: [CheckoutAdyenConfigurationReloadEvent],
      resetOn: [LoginEvent, LogoutEvent]
    }
  )

  getDataCollectionConfigurationState(): Observable<QueryState<AdyenDataCollectionConfig>> {
    return this.dataCollectionConfiguration.getState();
  }

  getDataCollectionConfiguration(): Observable<AdyenDataCollectionConfig | undefined> {
    return this.getDataCollectionConfigurationState().pipe(
      filter((state) => !state.loading),
      map((state) => state.data)
    );
  }
}
