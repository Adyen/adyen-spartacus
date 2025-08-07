import {Injectable} from "@angular/core";
import {AdyenBaseService} from "./adyen-base.service";
import {ActiveCartFacade} from "@spartacus/cart/base/root";
import {Query, QueryService, QueryState, UserIdService} from "@spartacus/core";
import {DataCollectionConfigConnector} from "../core/connectors/data-collection-config.connector";
import {AdyenDataCollectionConfig} from "../core/models/occ.config.models";
import {combineLatest, filter, map, Observable, switchMap} from "rxjs";

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
    () => this.preconditions().pipe(
      switchMap(([userId, cartId]) => this.dataCollectionConfigConnector.getDataCollectionConfiguration(userId, cartId))
    )
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

  protected preconditions(): Observable<[string, string]> {
    return combineLatest([
      this.userIdService.takeUserId(),
      this.activeCartFacade.takeActiveCartId(),
    ])
  }
}
