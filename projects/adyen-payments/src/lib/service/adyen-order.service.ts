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
  UserIdService
} from "@spartacus/core";
import {OrderConnector, OrderHistoryConnector, OrderService} from '@spartacus/order/core';
import {catchError, map, Observable, of, switchMap, tap} from "rxjs";
import {OrderPlacedEvent} from '@spartacus/order/root';
import {PlaceOrderConnector} from "../core/connectors/placeorder.connector";
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {AddressData, PlaceOrderRequest, PlaceOrderResponse} from "../core/models/occ.order.models";
import {HttpErrorResponse} from "@angular/common/http";
import {AdditionalDetailsConnector} from "../core/connectors/additional-details.connector";
import {errorCodePrefix} from "../assets/translations/translations";


@Injectable()
export class AdyenOrderService extends OrderService {
  private messageTimeout: number = 20000;
  private placeOrderErrorCodePrefix: string = errorCodePrefix + '.';

  constructor(protected placeOrderConnector: PlaceOrderConnector,
              protected additionalDetailsConnector: AdditionalDetailsConnector,
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


  protected adyenPlaceOrderCommand: Command<any, PlaceOrderResponse> =
    this.commandService.create<any, PlaceOrderResponse>(
      ({paymentData, billingAddress}) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId, cartId]) =>
            this.placeOrderConnector.placeOrder(userId, cartId, AdyenOrderService.preparePlaceOrderRequest(paymentData, billingAddress)).pipe(
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

  adyenPlaceOrder(paymentData: any, billingAddress?: Address): Observable<PlaceOrderResponse> {
    return this.adyenPlaceOrderCommand.execute({paymentData, billingAddress});
  }


  protected sendAdditionalDetailsCommand: Command<any, PlaceOrderResponse> =
    this.commandService.create<any, PlaceOrderResponse>(
      (details) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId, cartId]) =>
            this.additionalDetailsConnector.sendAdditionalDetails(userId, cartId, details).pipe(
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


  sendAdditionalDetails(details: any): Observable<PlaceOrderResponse> {
    return this.sendAdditionalDetailsCommand.execute(details);
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


  static preparePlaceOrderRequest(paymentData: any, billingAddress?: Address): PlaceOrderRequest {
    return {
      paymentRequest: paymentData,
      useAdyenDeliveryAddress: billingAddress === undefined,
      billingAddress: this.mapBillingAddress(billingAddress),
    }
  }

  static mapBillingAddress(billingAddress?: Address): AddressData | undefined {
    if (billingAddress) {
      return {
        addressId: billingAddress.id!,
        countryIso: billingAddress.country!.isocode!,
        firstName: billingAddress.firstName!,
        lastName: billingAddress.lastName!,
        line1: billingAddress.line1!,
        line2: billingAddress.line2!,
        phoneNumber: billingAddress.phone,
        postcode: billingAddress.postalCode!,
        regionIso: billingAddress.region ? billingAddress.region.isocode : undefined,
        saveInAddressBook: false,
        titleCode: billingAddress.titleCode!,
        townCity: billingAddress.town!
      }
    }
    return undefined;
  }

}
