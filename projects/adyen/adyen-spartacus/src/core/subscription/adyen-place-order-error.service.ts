import {inject, Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {GlobalMessageService, GlobalMessageType, TranslationService} from '@spartacus/core';
import {Observable, of} from 'rxjs';
import {errorCodePrefix} from '../../assets/translations/translations';
import {PlaceOrderResponse} from '../models/occ.order.models';

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

  protected messageTimeout: number = 20000;
  protected placeOrderErrorCodePrefix: string = errorCodePrefix + '.';

  /**
   * Shows the translated message for `error.error.errorCode`. `options` let callers that still expose
   * `messageTimeout` / `placeOrderErrorCodePrefix` (merchant subclasses) keep their overrides effective.
   */
  showMessage(error: HttpErrorResponse, options?: PlaceOrderErrorOptions): void {
    const linkPath: string | undefined = error.error.linkPath;
    const prefix = options?.errorCodePrefix ?? this.placeOrderErrorCodePrefix;
    const timeout = options?.messageTimeout ?? this.messageTimeout;
    this.translationService.translate(prefix + error.error.errorCode).subscribe((message) => {
      this.globalMessageService.add(this.decorateMessage(message, linkPath), GlobalMessageType.MSG_TYPE_ERROR, timeout);
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
   * DEFERRED: `linkPath` (e.g. `/my-account/subscriptions`) is carried in the error model
   * but NOT rendered, because My Subscriptions does not exist on Spartacus yet. When that page exists, render the
   * link here (the translated text already names "My Subscriptions"); this is the only place to change.
   */
  protected decorateMessage(message: string, linkPath?: string): string {
    return message;
  }
}
