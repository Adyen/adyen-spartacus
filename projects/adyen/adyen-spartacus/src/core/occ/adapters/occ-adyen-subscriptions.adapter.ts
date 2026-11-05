import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { OccEndpointsService } from "@spartacus/core";
import { Observable } from "rxjs";
import {
  AdyenSubscriptionEnrollmentResponse,
  AdyenSubscriptionOverview,
  AdyenSubscriptionPaymentMethodChangeRequest,
  AdyenSubscriptionPaymentMethodChangeResult
} from "../../models/occ.subscriptions.models";

@Injectable()
export class OccAdyenSubscriptionsAdapter {
  constructor(
    protected http: HttpClient,
    protected occEndpoints: OccEndpointsService
  ) {
  }

  public getSubscriptions(userId: string): Observable<AdyenSubscriptionOverview> {
    return this.http.get<AdyenSubscriptionOverview>(this.getSubscriptionsEndpoint(userId));
  }

  public cancelSubscription(userId: string, code: string, platform: string): Observable<Object> {
    return this.http.post<Object>(this.getCancelEndpoint(userId, code, platform), {});
  }

  public changePaymentMethod(userId: string, code: string,
                             body: AdyenSubscriptionPaymentMethodChangeRequest): Observable<AdyenSubscriptionPaymentMethodChangeResult> {
    return this.http.post<AdyenSubscriptionPaymentMethodChangeResult>(this.getPaymentMethodEndpoint(userId, code), body);
  }

  public getEnrollmentUrl(userId: string, code: string, platform: string): Observable<AdyenSubscriptionEnrollmentResponse> {
    return this.http.post<AdyenSubscriptionEnrollmentResponse>(this.getEnrollmentEndpoint(userId, code, platform), {});
  }

  protected getSubscriptionsEndpoint(userId: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/adyen/subscriptions', {
      urlParams: { userId }
    });
  }

  protected getCancelEndpoint(userId: string, code: string, platform: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/adyen/subscriptions/${code}/cancel', {
      urlParams: { userId, code },
      queryParams: { platform }
    });
  }

  protected getPaymentMethodEndpoint(userId: string, code: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/adyen/subscriptions/${code}/payment-method', {
      urlParams: { userId, code }
    });
  }

  protected getEnrollmentEndpoint(userId: string, code: string, platform: string): string {
    return this.occEndpoints.buildUrl('users/${userId}/adyen/subscriptions/${code}/payment-method/enrollment', {
      urlParams: { userId, code },
      queryParams: { platform }
    });
  }
}
