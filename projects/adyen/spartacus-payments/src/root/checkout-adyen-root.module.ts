/*
 * SPDX-FileCopyrightText: 2024 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { NgModule } from '@angular/core';
import { CART_BASE_FEATURE } from '@spartacus/cart/base/root';
import {
  CmsConfig,
  provideDefaultConfig,
  provideDefaultConfigFactory,
} from '@spartacus/core';
import {adyenCheckoutRoutingConfig} from "../config/adyen-checkout-routing-config";
import {adyenCheckoutConfig} from "../config/adyen-checkout-config";
import {CHECKOUT_CORE_FEATURE, CHECKOUT_FEATURE, CheckoutEventModule} from "@spartacus/checkout/base/root";
//import {interceptors} from "@spartacus/checkout/base/root/http-interceptors";

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

@NgModule({
  imports: [CheckoutEventModule],
  providers: [
//    ...interceptors,
    provideDefaultConfig(adyenCheckoutRoutingConfig),
    provideDefaultConfig(adyenCheckoutConfig),
    provideDefaultConfigFactory(adyenCheckoutComponentsConfig),
  ],
})
export class CheckoutAdyenRootModule {}
