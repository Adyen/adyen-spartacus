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
  merchantDisplayName: string,
  shopperEmail: string;
  clickToPayLocale: string;
  expressPaymentConfig: ExpressPaymentConfig;
}

export interface AdyenExpressConfigData {
  applePayMerchantId: string;
  applePayMerchantName: string;
  googlePayMerchantId: string;
  googlePayGatewayMerchantId: string;
  payPalIntent: string;
  shopperLocale: string;
  environmentMode: string;
  clientKey: string;
  merchantAccount: string;
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

export interface AmountData {
  value: number;
  currency: string;
}

interface AllowedCard {
  code: string,
  type: string
}
