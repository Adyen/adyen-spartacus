import {Injectable} from "@angular/core";
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
import {OrderConnector, OrderHistoryConnector, OrderService} from '@spartacus/order/core';
import {BehaviorSubject, catchError, map, Observable, of, switchMap, tap} from "rxjs";
import {OrderPlacedEvent} from '@spartacus/order/root';
import {AdyenOrderConnector} from "../core/connectors/adyen-order-connector.service";
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {AddressData, GooglePayExpressCartRequest, PlaceOrderResponse} from "../core/models/occ.order.models";
import {HttpErrorResponse} from "@angular/common/http";
import {errorCodePrefix} from "../assets/translations/translations";

@Injectable()
export class AdyenExpressOrderService extends OrderService {

  private messageTimeout: number = 20000;
  private placedOrderNumber$ = new BehaviorSubject<string | undefined>(undefined);
  private placeOrderErrorCodePrefix: string = errorCodePrefix + '.';

  constructor(protected placeOrderConnector: AdyenOrderConnector,
              protected override activeCartFacade: ActiveCartFacade,
              protected override userIdService: UserIdService,
              protected override commandService: CommandService,
              protected override orderConnector: OrderConnector,
              protected override eventService: EventService,
              protected globalMessageService: GlobalMessageService,
              protected orderHistoryConnector: OrderHistoryConnector,
              protected translationService: TranslationService
  ) {
    super(activeCartFacade, userIdService, commandService, orderConnector, eventService)
  }


  protected adyenPlaceOrderCommand: Command<GooglePayExpressCartRequest, PlaceOrderResponse> =
    this.commandService.create<GooglePayExpressCartRequest, PlaceOrderResponse>(
      (paymentData) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId, cartId]) =>
            this.placeOrderConnector.placeGoogleExpressOrderCart(userId, cartId, paymentData).pipe(
              tap((placeOrderResponse) => {
                this.placedOrder$.next(placeOrderResponse.orderData);
                this.placedOrderNumber$.next(placeOrderResponse.orderNumber)
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

  adyenPlaceOrder(paymentData: any, authorizedPaymentData: any, product: Product  ): Observable<PlaceOrderResponse> {
    return this.adyenPlaceOrderCommand.execute(this.prepareDataGoogle(paymentData,authorizedPaymentData, product));
  }

  prepareDataGoogle(paymentData: any,authorizedPaymentData: any,  product: Product): GooglePayExpressCartRequest {
    let baseData = {
      googlePayDetails: {
        googlePayToken: paymentData.paymentMethod.googlePayToken,
        googlePayCardNetwork: paymentData.paymentMethod.googlePayCardNetwork
      },
      addressData: {
        email: authorizedPaymentData.authorizedEvent.email,
        firstName: paymentData.deliveryAddress.firstName,
        // lastName: paymentData.payment.shippingContact.familyName,
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
    }
    if (product) {
      return {
        productCode: product.code,
        ...baseData
      }
    }else{
      return baseData;
    }
  }


  loadOrderDetails(orderCode: string): void {
    this.userIdService.takeUserId().subscribe(
      (userId) => {
        return this.orderHistoryConnector.get(userId, orderCode).subscribe((order) => {
          this.placedOrder$.next(order);
        })
      }
    );
  }

}
