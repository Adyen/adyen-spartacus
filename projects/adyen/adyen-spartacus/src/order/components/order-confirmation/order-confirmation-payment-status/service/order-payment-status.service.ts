import {Injectable} from "@angular/core";
import {QueryService, UserIdService} from "@spartacus/core";
import {OrderPaymentStatusConnector} from "../connector/order-payment-status.connector";
import {Observable, Subject} from "rxjs";

@Injectable()
export class OrderPaymentStatusService {
  constructor(
    protected userIdService: UserIdService,
    protected queryService: QueryService,
    protected orderPaymentStatusConnector: OrderPaymentStatusConnector,
  ) {
  }


  getOrderStatus(orderCode: string): Observable<string | undefined> {
    let userId = this.userIdService.takeUserId();
    let subject = new Subject<string>;

    userId.subscribe((userId) => {
      let orderStatus$ = this.orderPaymentStatusConnector.getOrderStatus(userId, orderCode);
      orderStatus$.subscribe((orderStatus) => {
        subject.next(orderStatus)
      })
    })
    return subject.asObservable();
  }

}
