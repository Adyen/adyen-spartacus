import {Injectable} from '@angular/core';
import {catchError, Observable, of} from 'rxjs';
import {PlaceOrderConnector} from '../core/connectors/placeorder.connector';
import {GlobalMessageService, GlobalMessageType, UserIdService} from "@spartacus/core";
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {map, switchMap} from 'rxjs/operators';
import {AdyenBaseService} from "./adyen-base.service";
import {PlaceOrderRequest, PlaceOrderResponse} from "../core/models/occ.order.models";
import {HttpErrorResponse} from "@angular/common/http";

@Injectable()
export class PlaceOrderAdyenService extends AdyenBaseService {
  private messageTimeout: number = 20000;

  constructor(
    protected placeOrderConnector: PlaceOrderConnector,
    protected override userIdService: UserIdService,
    protected override activeCartFacade: ActiveCartFacade,
    protected globalMessageService: GlobalMessageService
  ) {
    super(userIdService, activeCartFacade);
  }

  placeOrder(paymentData: any): Observable<any> {
    return this.checkoutPreconditions().pipe(
      switchMap(([userId, cartId]) =>
        this.placeOrderConnector.placeOrder(userId, cartId, PlaceOrderAdyenService.preparePlaceOrderRequest(paymentData)).pipe(
          map(response => {
            return {...response, success: true}
          }),
          catchError((error: HttpErrorResponse) => {
              console.log(error.error)
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
    );
  }

  static preparePlaceOrderRequest(paymentData: any): PlaceOrderRequest {
    return {
      paymentRequest: paymentData,
      useAdyenDeliveryAddress: true,
      billingAddress: undefined,
    }
  }

}
