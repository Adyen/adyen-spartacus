import {Injectable} from "@angular/core";
import {OccDataCollectionConfigAdapter} from "../occ/adapters/occ-data-collection-config.adapter";
import {AdyenDataCollectionConfig} from "../models/occ.config.models";
import {Observable} from "rxjs";

@Injectable()
export class DataCollectionConfigConnector {
  constructor(protected adapter: OccDataCollectionConfigAdapter) {
  }

 getDataCollectionConfiguration(userId: string, cartId: string): Observable<AdyenDataCollectionConfig> {
   return this.adapter.getDataCollectionConfiguration(userId, cartId);
 }
}
