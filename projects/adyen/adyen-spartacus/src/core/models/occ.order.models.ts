import { PaymentAction,PaymentResponseData } from "@adyen/adyen-web";
import { Order } from '@spartacus/order/root';

export interface ApplePayExpressRequest {
  cartId?: string;
  applePayDetails: any;
  addressData: any;
  productCode?: string;
}

export interface GooglePayExpressRequest {
  googlePayDetails: any;
  addressData: any;
  productCode?: string;
  cartId?: string;
  returnUrl?: string;
}

export interface PayPalExpressRequest {
  payPalDetails: any;
  productCode?: string;
  cartId?: string;
  addressData?: any;
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

export interface PayPalExpressSubmitResponse{
  success: boolean,
  paymentResponse?: PaymentResponseData,
  expressCartGuid?: string
  error?: string,
  errorFieldCodes?: string[]
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
