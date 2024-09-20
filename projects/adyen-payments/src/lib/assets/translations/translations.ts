import {TranslationChunksConfig, TranslationResources} from "@spartacus/core";
import {en} from "./en";

export const errorCodePrefix: string = "adyenPlaceOrderError";


export const adyenCheckoutTranslations: TranslationResources = {
  en,
};

export const adyenCheckoutTranslationChunksConfig: TranslationChunksConfig = {
  adyenCheckout: [
    'adyenCheckout'
  ],
  paymentErrors: [
    errorCodePrefix
  ]
}
