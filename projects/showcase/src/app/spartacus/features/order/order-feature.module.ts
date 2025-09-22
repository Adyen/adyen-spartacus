import {NgModule} from '@angular/core';
import {CmsConfig, I18nConfig, provideConfig} from "@spartacus/core";
import {orderTranslationChunksConfig, orderTranslations} from "@spartacus/order/assets";
import {ORDER_FEATURE, OrderFacade, OrderRootModule} from "@spartacus/order/root";
import {AdyenExpressOrderService, OrderConfirmationPaymentStatusModule} from "@adyen/adyen-spartacus";


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
          import('./order-wrapper.module').then((m) => m.OrderWrapperModule),
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
      useExisting: AdyenExpressOrderService,
    }
  ]
})
export class OrderFeatureModule { }
