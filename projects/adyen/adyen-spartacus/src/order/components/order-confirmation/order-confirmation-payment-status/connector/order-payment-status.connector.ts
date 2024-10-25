import {Injectable} from "@angular/core";
import {OccOrderStatusAdapter} from "../occ/occ-order-status.adapter";
import {Observable} from "rxjs";

@Injectable()
export class OrderPaymentStatusConnector {
  constructor(protected adapter: OccOrderStatusAdapter) {
  }

  getOrderStatus(userId: string, orderCode: string): Observable<string> {
    return this.adapter.getOrderPaymentStatus(userId, orderCode)
  }
}
