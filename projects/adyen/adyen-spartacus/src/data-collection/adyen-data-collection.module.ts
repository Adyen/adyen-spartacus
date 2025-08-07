import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ConfigModule } from "@spartacus/core";
import { AdyenDataCollectionComponent } from "./adyen-data-collection.component";
import {DataCollectionConfigConnector} from "../core/connectors/data-collection-config.connector";
import {OccDataCollectionConfigAdapter} from "../core/occ/adapters/occ-data-collection-config.adapter";
import {AdyenDataCollectionConfigurationService} from "../service/adyen-data-collection-configuration.service";


@NgModule({
  imports: [CommonModule,

    ConfigModule.withConfig({
      cmsComponents: {
        AdyenSpaDataCollection: {
          component: AdyenDataCollectionComponent
        }
      }
    })],
  providers: [
    AdyenDataCollectionConfigurationService,
    DataCollectionConfigConnector,
    OccDataCollectionConfigAdapter,
  ],
  declarations: [AdyenDataCollectionComponent],
  exports: [AdyenDataCollectionComponent],
})
export class AdyenDataCollectionModule {
}
