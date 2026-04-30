export interface StoredPaymentMethodResource {
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  number: string;
  lastFour: string;
  id: string
  variant: string
}

export interface ZeroAuthRequestBody {
  paymentMethodDto: {
    type: string;
    encryptedCardNumber: string;
    encryptedExpiryMonth: string;
    encryptedExpiryYear: string;
    encryptedSecurityCode: string;
    holderName: string;
  };
}

export interface ZeroAuthResponse {
  resultCode?: string;
  action?: any;
  [key: string]: any;
}
