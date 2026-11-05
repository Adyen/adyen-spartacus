import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { OccAdyenSubscriptionsAdapter } from "../occ/adapters/occ-adyen-subscriptions.adapter";
import {
  AdyenSubscriptionEnrollmentResponse,
  AdyenSubscriptionOverview,
  AdyenSubscriptionPaymentMethodChangeRequest,
  AdyenSubscriptionPaymentMethodChangeResult
} from "../models/occ.subscriptions.models";

@Injectable()
export class AdyenSubscriptionsConnector {
  constructor(protected adapter: OccAdyenSubscriptionsAdapter) {}

  getSubscriptions(userId: string): Observable<AdyenSubscriptionOverview> {
    return this.adapter.getSubscriptions(userId);
  }

  cancelSubscription(userId: string, code: string, platform: string): Observable<Object> {
    return this.adapter.cancelSubscription(userId, code, platform);
  }

  changePaymentMethod(userId: string, code: string,
                      body: AdyenSubscriptionPaymentMethodChangeRequest): Observable<AdyenSubscriptionPaymentMethodChangeResult> {
    return this.adapter.changePaymentMethod(userId, code, body);
  }

  getEnrollmentUrl(userId: string, code: string, platform: string): Observable<AdyenSubscriptionEnrollmentResponse> {
    return this.adapter.getEnrollmentUrl(userId, code, platform);
  }
}
