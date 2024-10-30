import {NgModule} from '@angular/core';
import {checkoutTranslationChunksConfig, checkoutTranslations} from "@spartacus/checkout/base/assets";
import {CHECKOUT_CORE_FEATURE, CHECKOUT_FEATURE, CheckoutStepType} from "@spartacus/checkout/base/root";
import {CmsConfig, I18nConfig, provideConfig,provideDefaultConfigFactory} from "@spartacus/core";
import {AdyenPaymentsModule} from "adyen-payments";
import {CART_BASE_FEATURE} from '@spartacus/cart/base/root';


export const CHECKOUT_BASE_CMS_COMPONENTS: string[] = [
  'CheckoutOrchestrator',
  'CheckoutOrderSummary',
  'CheckoutProgress',
  'CheckoutProgressMobileBottom',
  'CheckoutProgressMobileTop',
  'CheckoutDeliveryMode',
  'CheckoutAdyenPaymentDetails',
  'CheckoutPlaceOrder',
  'CheckoutReviewOrder',
  'CheckoutReviewPayment',
  'CheckoutReviewShipping',
  'CheckoutReviewOverview',
  'CheckoutDeliveryAddress',
  'GuestCheckoutLoginComponent',
];

export function adyenCheckoutComponentsConfig() {
  const config: CmsConfig = {
    featureModules: {
      [CHECKOUT_FEATURE]: {
        cmsComponents: CHECKOUT_BASE_CMS_COMPONENTS,
        dependencies: [CART_BASE_FEATURE],
      },
      // by default core is bundled together with components
      [CHECKOUT_CORE_FEATURE]: CHECKOUT_FEATURE,
    },
  };
  return config;
}

export const translationOverwrites = {
  en: { // lang
    checkout: { // chunk
      checkoutProgress: { // keys (nested)
        deliveryModePaymentDetails: 'Delivery Mode Payment Details',
      },
    },
  },
};

@NgModule({
  declarations: [],
  imports: [
    AdyenPaymentsModule
  ],
  providers: [
    provideDefaultConfigFactory(adyenCheckoutComponentsConfig),
    provideConfig(<CmsConfig>{
      featureModules: {
        [CHECKOUT_FEATURE]: {
          module: () =>
            import('@spartacus/checkout/base').then((m) => m.CheckoutModule),
        },
      }
    }),
    provideConfig({
      i18n: {resources: translationOverwrites},
    }),
    provideConfig(<I18nConfig>{
      i18n: {
        resources: checkoutTranslations,
        chunks: checkoutTranslationChunksConfig,
      },
      routing: {
        routes: {
          // Add a new route for the combined step
          checkoutAdyenPaymentDetails: {
            paths: ['checkout/adyen-payment-details'],
          },
        },
      },
      checkout: {
        steps: [
          {
            id: 'deliveryAddress',
            name: 'checkoutProgress.deliveryAddress',
            routeName: 'checkoutDeliveryAddress',
            type: [CheckoutStepType.DELIVERY_ADDRESS],
          },
          {
            id: 'deliveryMode',
            name: 'checkoutProgress.deliveryMode',
            routeName: 'checkoutDeliveryMode',
            type: [CheckoutStepType.DELIVERY_MODE],
          },
          {
            id: 'adyenPaymentDetails',
            name: 'checkoutProgress.paymentDetails',
            routeName: 'checkoutAdyenPaymentDetails',
            type: [CheckoutStepType.PAYMENT_DETAILS],
          },
        ],
      },
    })
  ]
})
export class CheckoutFeatureModule {
}
