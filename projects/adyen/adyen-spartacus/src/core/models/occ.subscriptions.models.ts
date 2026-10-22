export type AdyenSubscriptionState =
  | 'SETTING_UP'
  | 'ACTIVE'
  | 'STARTING_SOON'
  | 'ENDING'
  | 'PAUSED'
  | 'PAST_DUE'
  | 'PAST_DUE_ENDING'
  | 'ENDED'
  | 'UNAVAILABLE';

export type AdyenSubscriptionTone = 'normal' | 'attention' | 'quiet';

export type AdyenEnrollmentNotice = 'ADDS_METHOD' | 'REPLACES_METHOD_ON_FILE';

export type AdyenPaymentMethodChangeResultCode =
  | 'CHANGED_THIS_SUBSCRIPTION'
  | 'CHANGED_ALL_SUBSCRIPTIONS'
  | 'NOT_SUPPORTED_HERE'
  | 'FAILED';

export interface AdyenSubscriptionPaymentMethodOption {
  id: string;
  displayLabel: string;
  current: boolean;
}

export interface AdyenSubscriptionEntry {
  code: string;
  productName?: string;
  state: AdyenSubscriptionState;
  tone: AdyenSubscriptionTone;
  /** ISO-8601 or null. */
  effectiveDate?: string | null;
  quantity: number;
  orderCode?: string;
  /** ISO-8601. */
  orderDate?: string;
  paymentMethodSummary?: string;
  manageable: boolean;
  cancellable: boolean;
  paymentMethodChangeable: boolean;
  paymentMethodControl: boolean;
  paymentMethodShareable: boolean;
  paymentMethodChangeCovered: boolean;
  paymentMethodOptions?: AdyenSubscriptionPaymentMethodOption[];
  adyenVaultOptions?: AdyenSubscriptionPaymentMethodOption[];
}

export interface AdyenSubscriptionChangeOffer {
  subscriptionCode: string;
  accountName?: string;
  paymentMethodOptions?: AdyenSubscriptionPaymentMethodOption[];
  adyenVaultOptions?: AdyenSubscriptionPaymentMethodOption[];
}

export interface AdyenSubscriptionEnrollmentOffer {
  subscriptionCode: string;
  accountName?: string;
  notice: AdyenEnrollmentNotice;
}

export interface AdyenSubscriptionSection {
  platformCode: string;
  platformName: string;
  subscriptions?: AdyenSubscriptionEntry[];
  ordersAwaitingSetup?: string[];
  paymentMethodChangeOffers?: AdyenSubscriptionChangeOffer[];
  paymentMethodEnrollmentOffers?: AdyenSubscriptionEnrollmentOffer[];
  paymentMethodChangeSupported: boolean;
  paymentMethodChangeOffered: boolean;
  rowPaymentMethodControlOffered: boolean;
}

export interface AdyenSubscriptionOverview {
  sections?: AdyenSubscriptionSection[];
}

export interface AdyenSubscriptionPaymentMethodChangeRequest {
  platform: string;
  storedPaymentMethodId: string;
  applyToAll: boolean;
}

export interface AdyenSubscriptionPaymentMethodChangeResult {
  result: AdyenPaymentMethodChangeResultCode;
  moved: number;
  failed: number;
  partial: boolean;
}

export interface AdyenSubscriptionEnrollmentResponse {
  url: string;
}
