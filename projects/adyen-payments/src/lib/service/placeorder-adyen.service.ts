import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { PlaceOrderConnector } from '../core/connectors/placeorder.connector';
import {OCC_USER_ID_ANONYMOUS, Query, QueryNotifier, QueryService, QueryState, UserIdService} from "@spartacus/core";
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { switchMap } from 'rxjs/operators';
import {filter, map, take} from "rxjs/operators";
import {AdyenBaseService} from "./adyen-base.service";
import {PlaceOrderRequest} from "../core/models/occ.order.models";

@Injectable()
export class PlaceOrderAdyenService extends AdyenBaseService {
  constructor(
    protected placeOrderConnector: PlaceOrderConnector,
    protected override userIdService: UserIdService,
    protected override activeCartFacade: ActiveCartFacade
  ) {
    super(userIdService, activeCartFacade);
  }

  placeOrder(paymentData: any): Observable<any> {
    return this.checkoutPreconditions().pipe(
      switchMap(([userId, cartId]) =>
        this.placeOrderConnector.placeOrder(userId, cartId, PlaceOrderAdyenService.preparePlaceOrderRequest(paymentData))
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
