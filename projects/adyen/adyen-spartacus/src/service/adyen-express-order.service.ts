import {Injectable} from "@angular/core";
import {
  Command,
  CommandService,
  CommandStrategy,
  EventService,
  GlobalMessageService,
  GlobalMessageType,
  Product,
  TranslationService,
  UserIdService
} from "@spartacus/core";
import {OrderConnector, OrderHistoryConnector} from '@spartacus/order/core';
import {catchError, map, Observable, of, switchMap, tap} from "rxjs";
import {OrderPlacedEvent} from '@spartacus/order/root';
import {AdyenOrderConnector} from "../core/connectors/adyen-order-connector.service";
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {
  ApplePayExpressRequest,
  GooglePayExpressRequest,
  PayPalExpressRequest,
  PlaceOrderResponse
} from "../core/models/occ.order.models";
import {HttpErrorResponse} from "@angular/common/http";
import {AdyenOrderService} from "./adyen-order.service";
import {AdditionalDetailsConnector} from "../core/connectors/additional-details.connector";
import {PaymentData} from "@adyen/adyen-web";
import {ExpressCheckoutSuccessfulEvent, ExpressCheckoutWithAdditionalDetailsSuccessfulEvent} from "../events/checkout-adyen.events";

type ExpressPaymentDataRequest = GooglePayExpressRequest | ApplePayExpressRequest | PayPalExpressRequest;

type ExpressCommand = {
  paymentData: ExpressPaymentDataRequest,
  connectorFunction: (userId: string, cartId: string, request: ExpressPaymentDataRequest, isPDP: boolean) => Observable<PlaceOrderResponse>,
  isPDP: boolean,
}

@Injectable()
export class AdyenExpressOrderService extends AdyenOrderService {


  constructor(
    protected override placeOrderConnector: AdyenOrderConnector,
    protected override additionalDetailsConnector: AdditionalDetailsConnector,
    protected override activeCartFacade: ActiveCartFacade,
    protected override userIdService: UserIdService,
    protected override commandService: CommandService,
    protected override orderConnector: OrderConnector,
    protected override eventService: EventService,
    protected override globalMessageService: GlobalMessageService,
    protected override orderHistoryConnector: OrderHistoryConnector,
    protected override translationService: TranslationService
  ) {
    super(placeOrderConnector, additionalDetailsConnector, activeCartFacade, userIdService, commandService, orderConnector, eventService, globalMessageService, orderHistoryConnector, translationService);
  }

  protected adyenPlaceExpressOrderCommand: Command<ExpressCommand, PlaceOrderResponse> =
    this.commandService.create<ExpressCommand, PlaceOrderResponse>(
      (expressCommand) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId, cartId]) =>
            expressCommand.connectorFunction(userId, cartId, expressCommand.paymentData, expressCommand.isPDP).pipe(
              tap((placeOrderResponse) => {
                this.placedOrder$.next(placeOrderResponse.orderData);
                this.placedOrderNumber$.next(placeOrderResponse.orderNumber);
                if (!expressCommand.isPDP) {
                  this.eventService.dispatch(
                    {
                      userId,
                      cartId,
                      cartCode: cartId,
                      order: placeOrderResponse.orderData!,
                    },
                    OrderPlacedEvent
                  );
                }
                this.eventService.dispatch(
                  new ExpressCheckoutSuccessfulEvent()
                );
              }),
              map((response) => ({...response, success: true})),
              catchError((error: HttpErrorResponse) => this.handlePlaceOrderError(error))
            )
          )
        ),
      {
        strategy: CommandStrategy.CancelPrevious,
      }
    );

  protected sendAdditionalExpressDetailsCommand: Command<{ details: any }, PlaceOrderResponse> =
    this.commandService.create<any, PlaceOrderResponse>(
      (commandParam) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId ]) =>
            this.additionalDetailsConnector.sendAdditionalDetails(userId, commandParam.details).pipe(
              tap((placeOrderResponse) => {
                this.placedOrder$.next(placeOrderResponse.orderData);
                this.placedOrderNumber$.next(placeOrderResponse.orderNumber);
                this.eventService.dispatch(
                  {
                    userId,
                    order: placeOrderResponse.orderData!,
                  },
                  OrderPlacedEvent
                );
                this.eventService.dispatch(
                  new ExpressCheckoutWithAdditionalDetailsSuccessfulEvent()
                );
              }),
              map((response) => {
                return {...response, success: true}
              }),
              catchError((error: HttpErrorResponse) => {
                  this.translationService.translate(this.placeOrderErrorCodePrefix + error.error.errorCode).subscribe((message) => {
                    this.globalMessageService.add(message, GlobalMessageType.MSG_TYPE_ERROR, this.messageTimeout);
                  })

                  let response: PlaceOrderResponse = {
                    success: false,
                    error: error.error.errorCode,
                    errorFieldCodes: error.error.invalidFields
                  }
                  return of(response);
                }
              )
            )
          )
        ),
      {
        strategy: CommandStrategy.CancelPrevious,
      }
    );

  adyenPlaceGoogleExpressOrder(paymentData: any, authorizedPaymentData: any, product: Product, cartId: string): Observable<PlaceOrderResponse> {
    return this.adyenPlaceExpressOrderCommand.execute({
      paymentData: this.prepareDataGoogle(paymentData, authorizedPaymentData, cartId),
      connectorFunction: this.placeExpressGoogleOrderWrapper,
      isPDP: !!product
    });
  }

  sendAdditionalExpressDetails(details: any, cartId: string): Observable<PlaceOrderResponse> {
    return this.sendAdditionalExpressDetailsCommand.execute({details: details});
  }

  protected placeExpressGoogleOrderWrapper = (userId: string, cartId: string, request: ExpressPaymentDataRequest, isPDP: boolean) => {
    return this.placeOrderConnector.placeGoogleExpressOrderCart(userId, cartId, request as GooglePayExpressRequest, isPDP)
  }

  adyenPlaceAppleExpressOrder(paymentData: PaymentData, authorizedPaymentData: any, product: Product, cartId: string): Observable<PlaceOrderResponse> {
    return this.adyenPlaceExpressOrderCommand.execute({
      paymentData: this.prepareDataApple(paymentData, authorizedPaymentData, cartId),
      connectorFunction: this.placeExpressAppleOrderWrapper,
      isPDP: !!product
    });
  }

  protected placeExpressAppleOrderWrapper = (userId: string, cartId: string, request: ExpressPaymentDataRequest, isPDP: boolean) => {
    return this.placeOrderConnector.placeAppleExpressOrder(userId, cartId, request as ApplePayExpressRequest, isPDP)
  }

  adyenPlacePayPalExpressOrder(paymentData: PaymentData, authorizedPaymentData: any, product: Product, cartId: string): Observable<PlaceOrderResponse> {
    return this.adyenPlaceExpressOrderCommand.execute({
      paymentData: this.prepareDataPayPal(paymentData, authorizedPaymentData, cartId),
      connectorFunction: this.placeExpressPayPalOrderWrapper,
      isPDP: !!product
    });
  }

  protected placeExpressPayPalOrderWrapper = (userId: string, cartId: string, request: ExpressPaymentDataRequest,  isPDP: boolean) => {
    return this.placeOrderConnector.placePayPalExpressOrder(userId, cartId, request as PayPalExpressRequest, isPDP)
  }

  private handlePlaceOrderError(error: HttpErrorResponse): Observable<PlaceOrderResponse> {
    this.translationService.translate(this.placeOrderErrorCodePrefix + error.error.errorCode).subscribe((message) => {
      this.globalMessageService.add(message, GlobalMessageType.MSG_TYPE_ERROR, this.messageTimeout);
    });

    return of({
      success: false,
      error: error.error.errorCode,
      errorFieldCodes: error.error.invalidFields
    });
  }

  prepareDataGoogle(paymentData: any, authorizedPaymentData: any, cartId: string): GooglePayExpressRequest {
    return {
      cartId: cartId,
      googlePayDetails: paymentData.paymentMethod,
      returnUrl: window.location.href,
      addressData: {
        email: authorizedPaymentData.authorizedEvent.email,
        firstName: paymentData.deliveryAddress.firstName,
        line1: paymentData.deliveryAddress.street,
        line2: paymentData.deliveryAddress.houseNumberOrName,
        postalCode: paymentData.deliveryAddress.postalCode,
        town: paymentData.deliveryAddress.city,
        country: {
          isocode: paymentData.deliveryAddress.country,
        },
        region: {
          isocodeShort: paymentData.deliveryAddress.stateOrProvince
        }
      }
    };
  }

  prepareDataApple(paymentData: PaymentData, authorizedPaymentData: any, cartId: string): ApplePayExpressRequest {
    let event = authorizedPaymentData.authorizedEvent;

    return {
      cartId: cartId,
      applePayDetails: paymentData.paymentMethod,
      addressData: {
        email: event.payment.shippingContact?.emailAddress,
        firstName: event.payment.shippingContact?.givenName,
        lastName: event.payment.shippingContact?.familyName,
        line1: event.payment.shippingContact?.addressLines ? event.payment.shippingContact?.addressLines[0] : "",
        line2: event.payment.shippingContact?.addressLines ? event.payment.shippingContact?.addressLines[1] : "",
        postalCode: event.payment.shippingContact?.postalCode,
        town: event.payment.shippingContact?.locality,
        country: {
          isocode: event.payment.shippingContact?.countryCode,
        },
        region: {
          isocode: event.payment.shippingContact?.administrativeArea
        }
      }
    };
  }

  prepareDataPayPal(paymentData: PaymentData, authorizedPaymentData: any, cartId: string): PayPalExpressRequest {
    return {
      cartId: cartId,
      payPalDetails: {
        orderID: authorizedPaymentData.authorizedEvent.id,
        payerID: authorizedPaymentData.authorizedEvent.payer.payer_id
      },
      addressData: {
        email: authorizedPaymentData.authorizedEvent.payer.email_address,
        firstName: authorizedPaymentData.authorizedEvent.payer.name.given_name,
        lastName: authorizedPaymentData.authorizedEvent.payer.name.surname,
        line1: authorizedPaymentData.deliveryAddress.street,
        line2: authorizedPaymentData.deliveryAddress.houseNumberOrName,
        postalCode: authorizedPaymentData.deliveryAddress.postalCode,
        town: authorizedPaymentData.deliveryAddress.city,
        country: {
          isocode: authorizedPaymentData.deliveryAddress.country,
        },
        region: {
          isocodeShort: authorizedPaymentData.deliveryAddress.stateOrProvince
        }
      }
    };
  }

}
