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
import {ApplePayExpressRequest, GooglePayExpressCartRequest, PlaceOrderResponse} from "../core/models/occ.order.models";
import {HttpErrorResponse} from "@angular/common/http";
import {AdyenOrderService} from "./adyen-order.service";
import {AdditionalDetailsConnector} from "../core/connectors/additional-details.connector";
import {PaymentData} from "@adyen/adyen-web";

type ExpressPaymentDataRequest = GooglePayExpressCartRequest | ApplePayExpressRequest;

type ExpressCommand = {
  paymentData: ExpressPaymentDataRequest,
  connectorFunction: (userId: string, cartId: string, request: ExpressPaymentDataRequest) => Observable<PlaceOrderResponse>
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
            // this.placeOrderConnector.placeGoogleExpressOrderCart(userId, cartId, paymentData).pipe(
            expressCommand.connectorFunction(userId, cartId, expressCommand.paymentData).pipe(
              tap((placeOrderResponse) => {
                this.placedOrder$.next(placeOrderResponse.orderData);
                this.placedOrderNumber$.next(placeOrderResponse.orderNumber);
                this.eventService.dispatch(
                  {
                    userId,
                    cartId,
                    cartCode: cartId,
                    order: placeOrderResponse.orderData!,
                  },
                  OrderPlacedEvent
                );
              }),
              map((response) => ({ ...response, success: true })),
              catchError((error: HttpErrorResponse) => this.handlePlaceOrderError(error))
            )
          )
        ),
      {
        strategy: CommandStrategy.CancelPrevious,
      }
    );

  adyenPlaceGoogleExpressOrder(paymentData: any, authorizedPaymentData: any, product: Product): Observable<PlaceOrderResponse> {
    return this.adyenPlaceExpressOrderCommand.execute({paymentData: this.prepareDataGoogle(paymentData, authorizedPaymentData, product), connectorFunction: this.placeExpressGoogleOrderWrapper});
  }

  protected placeExpressGoogleOrderWrapper = (userId: string, cartId: string, request: ExpressPaymentDataRequest) => {
    return this.placeOrderConnector.placeGoogleExpressOrderCart(userId, cartId, request as GooglePayExpressCartRequest)
  }

  adyenPlaceAppleExpressOrder(paymentData: PaymentData, authorizedPaymentData: any, product: Product): Observable<PlaceOrderResponse> {
    return this.adyenPlaceExpressOrderCommand.execute({paymentData: this.prepareDataGoogle(paymentData, authorizedPaymentData, product), connectorFunction: this.placeExpressAppleOrderWrapper});
  }

  protected placeExpressAppleOrderWrapper = (userId: string, cartId: string, request: ExpressPaymentDataRequest) => {
    return this.placeOrderConnector.placeAppleExpressOrder(userId, cartId, request as ApplePayExpressRequest)
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

  prepareDataGoogle(paymentData: any, authorizedPaymentData: any, product: Product): GooglePayExpressCartRequest {
    const baseData = {
      googlePayDetails: paymentData.paymentMethod,
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
    delete baseData.googlePayDetails.subtype;
    return product ? { productCode: product.code, ...baseData } : baseData;
  }

  prepareDataApple(paymentData: PaymentData, authorizedPaymentData: any, product: Product): ApplePayExpressRequest {
    let event = authorizedPaymentData.authorizedEvent;

    const baseData = {
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
    return product ? { productCode: product.code, ...baseData } : baseData;
  }
}
