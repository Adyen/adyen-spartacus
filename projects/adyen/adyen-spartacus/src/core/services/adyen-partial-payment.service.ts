import { Injectable } from '@angular/core';
import {
  Command,
  CommandService,
  CommandStrategy,
  EventService,
  GlobalMessageService,
  GlobalMessageType,
  TranslationService,
  UserIdService
} from '@spartacus/core';
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { BehaviorSubject, catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import {
  GiftCardBalanceRequest,
  GiftCardBalanceResponse,
  PartialPaymentOrderRequest,
  PartialPaymentOrderResponse,
  PaymentState,
  PlaceOrderResponse
} from '../models/occ.order.models';
import { AdyenPartialPaymentConnector } from '../connectors/adyen-partial-payment.connector';
import { errorCodePrefix } from '../../assets/translations/translations';

@Injectable()
export class AdyenPartialPaymentService {
  protected messageTimeout: number = 20000;
  protected placeOrderErrorCodePrefix: string = errorCodePrefix + '.';

  // Payment state management
  protected paymentState$ = new BehaviorSubject<PaymentState>({
    errorCode: '',
    errorFieldCodes: [],
    orderNumber: '',
    partialPaymentId: undefined,
    redirectToNextStep: false
  });

  constructor(
    protected partialPaymentConnector: AdyenPartialPaymentConnector,
    protected activeCartFacade: ActiveCartFacade,
    protected userIdService: UserIdService,
    protected commandService: CommandService,
    protected eventService: EventService,
    protected globalMessageService: GlobalMessageService,
    protected translationService: TranslationService
  ) {}

  /**
   * Get current payment state
   */
  getPaymentState(): Observable<PaymentState> {
    return this.paymentState$.asObservable();
  }

  /**
   * Update payment state
   */
  protected updatePaymentState(updates: Partial<PaymentState>): void {
    const currentState = this.paymentState$.value;
    this.paymentState$.next({ ...currentState, ...updates });
  }

  /**
   * Check gift card balance command
   */
  protected checkGiftCardBalanceCommand: Command<GiftCardBalanceRequest, GiftCardBalanceResponse> =
    this.commandService.create<GiftCardBalanceRequest, GiftCardBalanceResponse>(
      (request) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId, cartId]) =>
            this.partialPaymentConnector.checkGiftCardBalance(userId, cartId, request).pipe(
              tap((response: GiftCardBalanceResponse) => {
                // Update partial payment ID if returned
                if (response.partialPaymentId) {
                  this.updatePaymentState({ partialPaymentId: response.partialPaymentId });
                }
              }),
              catchError((error: HttpErrorResponse) => this.handleError(error))
            )
          )
        ),
      {
        strategy: CommandStrategy.CancelPrevious,
      }
    );

  /**
   * Create partial payment order command
   */
  protected createPartialPaymentOrderCommand: Command<PartialPaymentOrderRequest, PartialPaymentOrderResponse> =
    this.commandService.create<PartialPaymentOrderRequest, PartialPaymentOrderResponse>(
      (request) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId, cartId]) =>
            this.partialPaymentConnector.createPartialPaymentOrder(userId, cartId, request).pipe(
              catchError((error: HttpErrorResponse) => this.handleError(error))
            )
          )
        ),
      {
        strategy: CommandStrategy.CancelPrevious,
      }
    );

  /**
   * Check gift card balance
   */
  checkGiftCardBalance(request: GiftCardBalanceRequest): Observable<GiftCardBalanceResponse> {
    return this.checkGiftCardBalanceCommand.execute(request);
  }

  /**
   * Create partial payment order
   */
  createPartialPaymentOrder(request: PartialPaymentOrderRequest): Observable<PartialPaymentOrderResponse> {
    return this.createPartialPaymentOrderCommand.execute(request);
  }

  /**
   * Handle balance check for Adyen DropIn
   */
  handleBalanceCheck(resolve: any, reject: any, data: any): void {
    const paymentMethod = data.paymentMethod || {};
    const cardNumber = paymentMethod.number || paymentMethod.encryptedCardNumber || paymentMethod.cardNumber;
    const pin = paymentMethod.cvc || paymentMethod.encryptedSecurityCode || paymentMethod.pin;
    const amount = data.amount;

    const request: GiftCardBalanceRequest = {
      cardNumber: cardNumber,
      pin: pin,
      amount: amount,
      brand: paymentMethod.brand,
      type: paymentMethod.type
    };

    this.checkGiftCardBalance(request).subscribe({
      next: (response) => {
        const balanceResponse = {
          balance: response.balance,
          transactionLimit: response.transactionLimit || response.balance,
          partialPaymentId: response.partialPaymentId,
          chargedAmount: response.chargedAmount,
          remainingAmount: response.remainingAmount
        };
        resolve(balanceResponse);
      },
      error: () => {
        reject();
      }
    });
  }

  /**
   * Handle order request for Adyen DropIn
   */
  handleOrderRequest(resolve: any, reject: any, data: any): void {
    const currentState = this.paymentState$.value;

    const request: PartialPaymentOrderRequest = {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      shopperReference: data.shopperReference,
      partialPaymentId: currentState.partialPaymentId
    };

    this.createPartialPaymentOrder(request).subscribe({
      next: (response) => {
        if (!response.orderData || !response.pspReference) {
          reject();
          return;
        }

        const orderResponse = {
          orderData: response.orderData,
          pspReference: response.pspReference
        };
        resolve(orderResponse);
      },
      error: () => {
        reject();
      }
    });
  }

  /**
   * Handle payment response and determine next steps
   */
  handlePaymentResponse(response: PlaceOrderResponse): void {
    if (response && response.success) {
      if (response.executeAction) {
        // Action required - will be handled by DropIn
        return;
      }

      // Check if this is a partial payment with remaining amount
      if (response.paymentsResponse &&
        response.paymentsResponse.order &&
        response.paymentsResponse.order.remainingAmount &&
        response.paymentsResponse.order.remainingAmount.value > 0) {

        // Partial payment completed, but more payment needed
        // DropIn will handle showing remaining amount
        return;
      }

      // Payment fully completed
      if (response.orderNumber) {
        this.updatePaymentState({
          orderNumber: response.orderNumber,
          redirectToNextStep: true
        });
      }
    } else {
      // Handle error
      this.updatePaymentState({
        errorCode: response.error || 'UNKNOWN_ERROR',
        errorFieldCodes: response.errorFieldCodes || []
      });
    }
  }

  /**
   * Reset payment state
   */
  resetPaymentState(): void {
    this.paymentState$.next({
      errorCode: '',
      errorFieldCodes: [],
      orderNumber: '',
      partialPaymentId: undefined,
      redirectToNextStep: false
    });
  }

  /**
   * Check checkout preconditions (user and cart)
   */
  protected checkoutPreconditions(): Observable<[string, string]> {
    return this.userIdService.takeUserId().pipe(
      switchMap((userId) =>
        this.activeCartFacade.getActiveCartId().pipe(
          map((cartId) => [userId, cartId] as [string, string])
        )
      )
    );
  }

  /**
   * Handle API errors
   */
  protected handleError(error: HttpErrorResponse): Observable<any> {
    this.translationService.translate(this.placeOrderErrorCodePrefix + error.error.errorCode).subscribe((message) => {
      this.globalMessageService.add(message, GlobalMessageType.MSG_TYPE_ERROR, this.messageTimeout);
    });

    this.updatePaymentState({
      errorCode: error.error.errorCode,
      errorFieldCodes: error.error.invalidFields || []
    });

    return of({
      success: false,
      error: error.error.errorCode,
      errorFieldCodes: error.error.invalidFields
    });
  }
}
