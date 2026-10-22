import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { AuthGuard, CmsConfig, I18nConfig, I18nModule, UrlModule, provideDefaultConfig } from "@spartacus/core";
import { SpinnerModule } from "@spartacus/storefront";
import { AdyenMySubscriptionsComponent } from "./adyen-my-subscriptions.component";
import { AdyenSubscriptionsService } from "../../core/services/adyen-subscriptions.service";
import { AdyenSubscriptionsConnector } from "../../core/connectors/adyen-subscriptions.connector";
import { OccAdyenSubscriptionsAdapter } from "../../core/occ/adapters/occ-adyen-subscriptions.adapter";
import { adyenMySubscriptions } from "../../assets/translations/en/adyen-my-subscriptions";

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    I18nModule,
    UrlModule,
    SpinnerModule
  ],
  declarations: [
    AdyenMySubscriptionsComponent
  ],
  providers: [
    provideDefaultConfig(<CmsConfig>{
      cmsComponents: {
        AdyenMySubscriptionsComponent: {
          component: AdyenMySubscriptionsComponent,
          guards: [AuthGuard],
        },
      },
    }),
    provideDefaultConfig(<I18nConfig>{
      i18n: {
        resources: { en: { adyenMySubscriptions: adyenMySubscriptions } },
        chunks: { adyenMySubscriptions: ['adyenMySubscriptions'] },
      },
    }),
    AdyenSubscriptionsService,
    AdyenSubscriptionsConnector,
    OccAdyenSubscriptionsAdapter
  ],
})
export class AdyenMySubscriptionsModule {}
