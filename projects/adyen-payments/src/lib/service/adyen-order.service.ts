import {Injectable} from "@angular/core";
import {Command, CommandService, CommandStrategy, EventService, GlobalMessageService, GlobalMessageType, UserIdService} from "@spartacus/core";
import {OrderConnector, OrderService} from '@spartacus/order/core';
import {catchError, map, Observable, of, switchMap, tap} from "rxjs";
import {OrderPlacedEvent} from '@spartacus/order/root';
import {PlaceOrderConnector} from "../core/connectors/placeorder.connector";
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {PlaceOrderRequest, PlaceOrderResponse} from "../core/models/occ.order.models";
import {HttpErrorResponse} from "@angular/common/http";


@Injectable()
export class AdyenOrderService extends OrderService {
  private messageTimeout: number = 20000;

  constructor(protected placeOrderConnector: PlaceOrderConnector,
              protected override activeCartFacade: ActiveCartFacade,
              protected override userIdService: UserIdService,
              protected override commandService: CommandService,
              protected override orderConnector: OrderConnector,
              protected override eventService: EventService,
              protected globalMessageService: GlobalMessageService

  ) {
    super(activeCartFacade, userIdService, commandService, orderConnector, eventService)
  }


  protected adyenPlaceOrderCommand: Command<any, PlaceOrderResponse> =
    this.commandService.create<any, PlaceOrderResponse>(
      (paymentData) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId, cartId]) =>
            this.placeOrderConnector.placeOrder(userId, cartId, AdyenOrderService.preparePlaceOrderRequest(paymentData)).pipe(
              tap((placeOrderResponse) => {
                this.placedOrder$.next(placeOrderResponse.orderData);
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
              map((response) => {
                return {...response, success: true}
              }),
              catchError((error: HttpErrorResponse) => {
                  this.globalMessageService.add(error.error.errorCode, GlobalMessageType.MSG_TYPE_ERROR, this.messageTimeout);
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

  adyenPlaceOrder(paymentData: any): Observable<PlaceOrderResponse> {
    return this.adyenPlaceOrderCommand.execute(paymentData);
  }


  static preparePlaceOrderRequest(paymentData: any): PlaceOrderRequest {
    return {
      paymentRequest: paymentData,
      useAdyenDeliveryAddress: true,
      billingAddress: undefined,
    }
  }

}
