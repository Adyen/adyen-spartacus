import {NgModule} from '@angular/core';
import {CmsConfig, I18nConfig, provideConfig} from "@spartacus/core";
import {orderTranslationChunksConfig, orderTranslations} from "@spartacus/order/assets";
import {ORDER_FEATURE, OrderFacade, OrderRootModule} from "@spartacus/order/root";
import {AdyenOrderService, OrderConfirmationPaymentStatusModule} from "adyen-payments";

@NgModule({
  declarations: [],
  imports: [
    OrderRootModule,
    OrderConfirmationPaymentStatusModule
  ],
  providers: [provideConfig(<CmsConfig>{
    featureModules: {
      [ORDER_FEATURE]: {
        module: () =>
          import('@spartacus/order').then((m) => m.OrderModule),
      },
    }
  }),
    provideConfig(<I18nConfig>{
      i18n: {
        resources: orderTranslations,
        chunks: orderTranslationChunksConfig,
      },
    }),
    {
      provide: OrderFacade,
      useExisting: AdyenOrderService,
    }
  ]
})
export class OrderFeatureModule { }
