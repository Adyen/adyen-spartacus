import {NgModule} from "@angular/core";
import {AuthGuard, CmsConfig, I18nModule, provideDefaultConfig} from "@spartacus/core";
import {AdyenMyStoredCardsComponent} from "./adyen-my-stored-cards.component";
import {CommonModule} from "@angular/common";
import { RouterModule } from "@angular/router";
import {AdyenMyAccountService} from "../service/adyen-my-account.service";
import {AdyenMyAccountConnector} from "../core/connectors/adyen-my-account.connector";
import {OccAdyenMyAccountAdapter} from "../core/occ/adapters/occ-adyen-my-account.adapter";
import { CardModule, SpinnerModule } from "@spartacus/storefront";

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    I18nModule,
    CardModule,
    SpinnerModule
  ],
  declarations: [
    AdyenMyStoredCardsComponent
  ],
  providers: [
    provideDefaultConfig(<CmsConfig>{
      cmsComponents: {
        AdyenMyStoredCardsComponent: {
          component: AdyenMyStoredCardsComponent,
          guards: [AuthGuard],
        },
      },
    }),
    AdyenMyAccountService,
    AdyenMyAccountConnector,
    OccAdyenMyAccountAdapter
  ],
})
export class AdyenMyAccountModule {}
