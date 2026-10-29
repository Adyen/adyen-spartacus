import {inject, Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {GlobalMessageService, GlobalMessageType, TranslationService} from '@spartacus/core';
import {Observable, of, take} from 'rxjs';
import {errorCodePrefix} from '../../assets/translations/translations';
import {PlaceOrderResponse} from '../models/occ.order.models';
import {SUBSCRIPTION_ERROR_CODE} from './subscription-guard.const';
import {AdyenSubscriptionLinkService} from './adyen-subscription-link.service';

export interface PlaceOrderErrorOptions {
  /** Global message timeout in ms (default 20000). */
  messageTimeout?: number;
  /** Translation key prefix for `errorCode` (default `adyenPlaceOrderError.`). */
  errorCodePrefix?: string;
}

/**
 * Turns an error from an Adyen checkout endpoint (place-order, partial payment, express Google/Apple/PayPal)
 * into a translated global message and a {@link PlaceOrderResponse}. Shared so every path shows the same message,
 * including the duplicate-subscription refusals (`checkout.error.subscription*`).
 */
@Injectable({providedIn: 'root'})
export class AdyenPlaceOrderErrorService {
  protected translationService: TranslationService = inject(TranslationService);
  protected globalMessageService: GlobalMessageService = inject(GlobalMessageService);
  protected subscriptionLinkService: AdyenSubscriptionLinkService = inject(AdyenSubscriptionLinkService);

  protected messageTimeout: number = 20000;
  protected placeOrderErrorCodePrefix: string = errorCodePrefix + '.';

  /**
   * Shows the translated message for `error.error.errorCode`. `options` let callers that still expose
   * `messageTimeout` / `placeOrderErrorCodePrefix` (merchant subclasses) keep their overrides effective.
   */
  showMessage(error: HttpErrorResponse, options?: PlaceOrderErrorOptions): void {
    const errorCode: string | undefined = error.error.errorCode;
    const prefix = options?.errorCodePrefix ?? this.placeOrderErrorCodePrefix;
    const timeout = options?.messageTimeout ?? this.messageTimeout;
    this.translationService.translate(prefix + errorCode).pipe(take(1)).subscribe((message) => {
      this.globalMessageService.add(message, GlobalMessageType.MSG_TYPE_ERROR, timeout);
      this.showLink(errorCode, message, timeout);
    });
  }

  toResponse(error: HttpErrorResponse): PlaceOrderResponse {
    return {
      success: false,
      error: error.error.errorCode,
      errorFieldCodes: error.error.invalidFields,
      linkPath: error.error.linkPath
    };
  }

  handle(error: HttpErrorResponse, options?: PlaceOrderErrorOptions): Observable<PlaceOrderResponse> {
    this.showMessage(error, options);
    return of(this.toResponse(error));
  }

  /**
   * `cx-global-message` renders translated text only, so the already-owned refusal (`checkout.error.subscriptionAlreadyOwned`)
   * gets a "Manage your subscriptions" link from {@link AdyenSubscriptionLinkService} below the message, tied to it.
   * The trigger is the error code only (other codes get no link, even with a `linkPath`); the target is always the
   * semantic route `mySubscriptions`.
   */
  protected showLink(errorCode: string | undefined, message: string, timeout: number): void {
    if (errorCode === SUBSCRIPTION_ERROR_CODE.ALREADY_OWNED) {
      this.subscriptionLinkService.show(timeout, {raw: message});
    }
  }
}
