import { Injectable } from "@angular/core";
import {
  Address,
  Command,
  CommandService,
  CommandStrategy,
  EventService,
  GlobalMessageService,
  GlobalMessageType,
  TranslationService,
  UserIdService,
  Product
} from "@spartacus/core";
import { OrderConnector, OrderHistoryConnector, OrderService } from '@spartacus/order/core';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, tap } from "rxjs";
import { OrderPlacedEvent } from '@spartacus/order/root';
import { AdyenOrderConnector } from "../core/connectors/adyen-order-connector.service";
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { AddressData, GooglePayExpressCartRequest, PlaceOrderResponse } from "../core/models/occ.order.models";
import { HttpErrorResponse } from "@angular/common/http";
import { errorCodePrefix } from "../assets/translations/translations";
import {AdyenOrderService} from "./adyen-order.service";
import {AdditionalDetailsConnector} from "../core/connectors/additional-details.connector";

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

  protected adyenPlaceExpressOrderCommand: Command<GooglePayExpressCartRequest, PlaceOrderResponse> =
    this.commandService.create<GooglePayExpressCartRequest, PlaceOrderResponse>(
      (paymentData) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId, cartId]) =>
            this.placeOrderConnector.placeGoogleExpressOrderCart(userId, cartId, paymentData).pipe(
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

  adyenPlaceExpressOrder(paymentData: any, authorizedPaymentData: any, product: Product): Observable<PlaceOrderResponse> {
    return this.adyenPlaceExpressOrderCommand.execute(this.prepareDataGoogle(paymentData, authorizedPaymentData, product));
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
    delete baseData.googlePayDetails.type;
    return product ? { productCode: product.code, ...baseData } : baseData;
  }
}
