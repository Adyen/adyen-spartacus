import {Injectable} from "@angular/core";
import {
  PayPalExpressRequest, PaypalUpdateOrderRequest,
  PayPalExpressSubmitResponse,
  PlaceOrderResponse, PaypalUpdateOrderResponse
} from "../../core/models/occ.order.models";

import {
  Command,
  CommandService,
  CommandStrategy,
  EventService,
  GlobalMessageService,
  Product,
  TranslationService,
  UserIdService
} from "@spartacus/core";
import {catchError, map, Observable, of, switchMap, tap} from "rxjs";
import {AdyenOrderConnector} from "../../core/connectors/adyen-order-connector.service";
import {AdditionalDetailsConnector} from "../../core/connectors/additional-details.connector";
import {AdyenBaseService} from "../../service/adyen-base.service";
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {HttpErrorResponse} from "@angular/common/http";
import {PaymentData} from "@adyen/adyen-web";

type PayPalSubmitCommand = {
  paymentData: PayPalExpressRequest,
  connectorFunction: (userId: string, cartId: string, request: PayPalExpressRequest) => Observable<PlaceOrderResponse>,
  isPDP: boolean,
  cartId: string
}

type PayPalUpdateOrderCommand = {
  request: PaypalUpdateOrderRequest,
  connectorFunction: (userId: string,request: PaypalUpdateOrderRequest) => Observable<PaypalUpdateOrderResponse>,

}

@Injectable()
export class PaypalExpressService extends AdyenBaseService{

  constructor(
    protected placeOrderConnector: AdyenOrderConnector,
    protected additionalDetailsConnector: AdditionalDetailsConnector,
    protected override activeCartFacade: ActiveCartFacade,
    protected override userIdService: UserIdService,
    protected commandService: CommandService,
    protected eventService: EventService,
    protected globalMessageService: GlobalMessageService,
    protected translationService: TranslationService
  ){
    super(userIdService, activeCartFacade)
  }

  protected paypalSubmitCommand: Command<PayPalSubmitCommand, PayPalExpressSubmitResponse> =
    this.commandService.create<PayPalSubmitCommand, PayPalExpressSubmitResponse>(
      (expressCommand) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId]) =>
            expressCommand.connectorFunction(userId, expressCommand.cartId, expressCommand.paymentData).pipe(
              tap((placeOrderResponse) => {
                if (!expressCommand.isPDP) {
                  this.eventService.dispatch(
                    {
                      userId,
                      cartId: expressCommand.cartId,
                      cartCode: expressCommand.cartId,
                      order: placeOrderResponse.orderData!,
                    },
                  );
                }
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

  protected paypalUpdateOrderCommand: Command<PayPalUpdateOrderCommand, PaypalUpdateOrderResponse> =
    this.commandService.create<PayPalUpdateOrderCommand, PaypalUpdateOrderResponse>(
      (expressCommand) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId]) =>
            expressCommand.connectorFunction(userId, expressCommand.request).pipe(
              tap((paypalUpdateResponse) => {
              }),
              catchError((error: HttpErrorResponse) => this.handlePayPalUpdateError(error))
            )
          )
        ),
      {
        strategy: CommandStrategy.CancelPrevious,
      }
    );

  submitPayPal(paymentData: PaymentData,  product: Product, cartId: string): Observable<PayPalExpressSubmitResponse> {
    return this.paypalSubmitCommand.execute({paymentData: this.prepareDataPayPal(paymentData, product, cartId), connectorFunction: this.submitPayPalWrapper, isPDP: !!product, cartId});
  }



  protected submitPayPalWrapper = (userId: string, cartId: string, request: PayPalExpressRequest) => {
    return this.placeOrderConnector.handlePayPalSubmit(userId, cartId, request)
  }

  prepareDataPayPal(paymentData: PaymentData, product: Product, cartId: string): PayPalExpressRequest {
    const baseData = {
      payPalDetails: paymentData.paymentMethod,
      cartId
    };
    delete baseData.payPalDetails['userAction'];
    return product ? { productCode: product.code, ...baseData } : baseData;
  }

  updatePaypalOrder( request: PaypalUpdateOrderRequest): Observable<PaypalUpdateOrderResponse> {
    return this.paypalUpdateOrderCommand.execute({request: request , connectorFunction: this.updatePayPalWrapper});
  }

  protected updatePayPalWrapper = (userId: string, request: PaypalUpdateOrderRequest) => {
    return this.placeOrderConnector.updatePaypalOrder(userId, request)
  }

  private handlePlaceOrderError(error: HttpErrorResponse): Observable<PayPalExpressSubmitResponse> {
    return of({
      success: false,
      error: error.error.errorCode,
      errorFieldCodes: error.error.invalidFields
    });
  }

  private handlePayPalUpdateError(error: HttpErrorResponse): Observable<PaypalUpdateOrderResponse> {
    return of({
      paymentData: null,
      status: 'ERROR'
    });
  }

}
