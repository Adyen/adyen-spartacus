export interface AdyenRecurringDetail {
  card: Card
  billingAddress: Address
  recurringDetailReference: string
  variant: string
}

export interface Card {
  cvc: string;
  expiryMonth: string;
  expiryYear: string;
  holderName: string;
  issueNumber: string;
  number: string;
  startMonth: string;
  startYear: string;
}

export interface Address {
  city: string;
  country: string;
  houseNumberOrName: string;
  postalCode: string;
  stateOrProvince: string;
  street: string;
}
