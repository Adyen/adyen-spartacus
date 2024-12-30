import {PaymentMethod} from "@adyen/adyen-web";

export interface AdyenConfigData {
  paymentMethods: PaymentMethod[];
  connectedTerminalList: string[];
  storedPaymentMethodList: StoredPaymentMethodData[];
  issuerLists: Map<string, string>;
  creditCardLabel: string;
  allowedCards: AllowedCard[];
  amount: AmountData;
  amountDecimal: number;
  adyenClientKey: string;
  adyenPaypalMerchantId: string;
  deviceFingerPrintUrl: string;
  sessionData: SessionData;
  selectedPaymentMethod: string;
  showRememberTheseDetails: boolean;
  checkoutShopperHost: string;
  environmentMode: string;
  shopperLocale: string;
  openInvoiceMethods: string[];
  showSocialSecurityNumber: boolean;
  showBoleto: boolean;
  showComboCard: boolean;
  showPos: boolean;
  immediateCapture: boolean;
  countryCode: string;
  cardHolderNameRequired: boolean;
  sepaDirectDebit: boolean;
  expressPaymentConfig: ExpressPaymentConfig;
}

export interface AdyenExpressConfigData {
  applePayMerchantId: string;
  applePayMerchantName: string;
  payPalIntent: string;
  shopperLocale: string;
  environmentMode: string;
  clientKey: string;
  merchantAccount: string;
  //TODO: Remove in 13.3
  sessionData: SessionData;
  amount: AmountData;
  amountDecimal: number;
  dfUrl: string;
  checkoutShopperHost: string;
  expressPaymentConfig: ExpressPaymentConfig;
  countryCode: string;
}

interface ExpressPaymentConfig {
  googlePayExpressEnabledOnCart: boolean,
  applePayExpressEnabledOnCart: boolean,
  paypalExpressEnabledOnCart: boolean,
  amazonPayExpressEnabledOnCart: boolean,
  googlePayExpressEnabledOnProduct: boolean,
  applePayExpressEnabledOnProduct: boolean,
  paypalExpressEnabledOnProduct: boolean,
  amazonPayExpressEnabledOnProduct: boolean
}

interface SessionData {
  id: string,
  sessionData: string
}

interface StoredPaymentMethodData {
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  holderName: string;
  iban: string;
  id: string;
  lastFour: string;
  name: string;
  networkTxReference: string;
  ownerName: string;
  shopperEmail: string;
  supportedShopperInteractions: string[];
  type: string;
}

interface AmountData {
  value: number;
  currency: string;
}

interface AllowedCard {
  code: string,
  type: string
}
