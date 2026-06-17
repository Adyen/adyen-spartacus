import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {OccEndpointsService} from "@spartacus/core";
import {Observable} from "rxjs";

@Injectable()
export class OccOrderStatusAdapter {

  constructor(
    protected http: HttpClient,
    protected occEndpoints: OccEndpointsService,
  ) {
  }

  public getOrderPaymentStatus(userId: string, orderCode: string): Observable<string> {
    return this.http.get(this.getOrderPaymentStatusEndpoint(userId, orderCode), {responseType: 'text'});
  }

  protected getOrderPaymentStatusEndpoint(userId: string, orderCode: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/adyen/payment-status/${orderCode}', {
      urlParams: {
        userId,
        orderCode
      }
    })
  }

}
