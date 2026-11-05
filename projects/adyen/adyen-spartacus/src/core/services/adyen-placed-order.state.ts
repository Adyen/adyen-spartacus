import {Injectable} from '@angular/core';
import {Order} from '@spartacus/order/root';
import {BehaviorSubject} from 'rxjs';

/**
 * Holds the placed order shared by every Adyen order service instance.
 * `AdyenOrderService` and `AdyenExpressOrderService` are provided by different modules (separate instances),
 * while Spartacus guards read the order through whichever one is bound to `OrderFacade`.
 * To customise it, replace it through DI (`{provide: AdyenPlacedOrderState, useClass: ...}`); overriding the
 * `placedOrderState` field in a service subclass has no effect, because the subjects are taken in the base class.
 */
@Injectable({providedIn: 'root'})
export class AdyenPlacedOrderState {
  readonly placedOrder$ = new BehaviorSubject<Order | undefined>(undefined);
  readonly placedOrderNumber$ = new BehaviorSubject<string | undefined>(undefined);
}
