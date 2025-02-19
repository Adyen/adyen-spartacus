import { PaymentAction,PaymentResponseData } from "@adyen/adyen-web";
import { Order } from '@spartacus/order/root';

export interface ApplePayExpressRequest {
  applePayDetails: any;
  addressData: any;
  productCode?: string;
}

export interface GooglePayExpressCartRequest {
  googlePayDetails: any;
  addressData: any;
  productCode?: string;
  cartId?: string;
}

export interface PlaceOrderRequest {
  paymentRequest: any;

  //Billing address related fields
  useAdyenDeliveryAddress?: boolean;
  billingAddress?: AddressData;
}

export interface PlaceOrderResponse {
  success: boolean,
  executeAction?: boolean,
  paymentsAction?: PaymentAction,
  paymentsResponse?: PaymentResponseData,
  paymentDetailsResponse?: PaymentResponseData,
  error?: string,
  errorFieldCodes?: string[]
  orderNumber?: string,
  orderData?: Order
}

export interface AddressData {
  addressId: string;
  titleCode: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  townCity: string;
  regionIso?: string;
  postcode: string;
  countryIso: string;
  phoneNumber?: string;
  saveInAddressBook: boolean;
}
