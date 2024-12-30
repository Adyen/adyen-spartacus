import { CoreConfiguration } from "@adyen/adyen-web";
import {AdyenExpressConfigData} from "../core/models/occ.config.models";

export function getAdyenExpressCheckoutConfig(adyenConfig: AdyenExpressConfigData): CoreConfiguration {
  return {
    locale: adyenConfig.shopperLocale,
    environment: castToEnvironment(adyenConfig.environmentMode),
    clientKey: adyenConfig.clientKey,
    session: {
      id: adyenConfig.sessionData.id,
      sessionData: adyenConfig.sessionData.sessionData
    },
    countryCode: adyenConfig.countryCode ? adyenConfig.countryCode : 'US',
    analytics: {
      enabled: false
    },
    //@ts-ignore
    risk: {
      enabled: true
    }
  };
}

function castToEnvironment(env: string): CoreConfiguration['environment'] {
  const validEnvironments: CoreConfiguration['environment'][] = ['test', 'live', 'live-us', 'live-au', 'live-apse', 'live-in'];
  if (validEnvironments.includes(env as CoreConfiguration['environment'])) {
    return env as CoreConfiguration['environment'];
  }
  throw new Error(`Invalid environment: ${env}`);
}
