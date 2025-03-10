import {Injectable} from "@angular/core";
import {
  PayPalExpressRequest,
  PayPalExpressSubmitResponse,
  PlaceOrderResponse
} from "../../core/models/occ.order.models";

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

  private handlePlaceOrderError(error: HttpErrorResponse): Observable<PayPalExpressSubmitResponse> {
    return of({
      success: false,
      error: error.error.errorCode,
      errorFieldCodes: error.error.invalidFields
    });
  }
}
