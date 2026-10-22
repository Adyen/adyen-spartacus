import { Injectable } from "@angular/core";
import { UserIdService } from "@spartacus/core";
import { Observable, switchMap, take } from "rxjs";
import { AdyenSubscriptionsConnector } from "../connectors/adyen-subscriptions.connector";
import {
  AdyenSubscriptionEnrollmentResponse,
  AdyenSubscriptionOverview,
  AdyenSubscriptionPaymentMethodChangeResult
} from "../models/occ.subscriptions.models";

/**
 * Talks to `users/{userId}/adyen/subscriptions`. Unlike the stored-cards service it does not go through
 * `checkoutPreconditions()`: that waits for an active cart, and a shopper with no cart must still see this page.
 */
@Injectable()
export class AdyenSubscriptionsService {
  constructor(
    protected userIdService: UserIdService,
    protected adyenSubscriptionsConnector: AdyenSubscriptionsConnector
  ) {}

  getSubscriptions(): Observable<AdyenSubscriptionOverview> {
    return this.loggedInUserId().pipe(
      switchMap((userId) => this.adyenSubscriptionsConnector.getSubscriptions(userId))
    );
  }

  cancelSubscription(code: string, platform: string): Observable<Object> {
    return this.loggedInUserId().pipe(
      switchMap((userId) => this.adyenSubscriptionsConnector.cancelSubscription(userId, code, platform))
    );
  }

  changePaymentMethod(code: string, platform: string, storedPaymentMethodId: string,
                      applyToAll: boolean): Observable<AdyenSubscriptionPaymentMethodChangeResult> {
    return this.loggedInUserId().pipe(
      switchMap((userId) => this.adyenSubscriptionsConnector.changePaymentMethod(userId, code,
        { platform, storedPaymentMethodId, applyToAll }))
    );
  }

  getEnrollmentUrl(code: string, platform: string): Observable<AdyenSubscriptionEnrollmentResponse> {
    return this.loggedInUserId().pipe(
      switchMap((userId) => this.adyenSubscriptionsConnector.getEnrollmentUrl(userId, code, platform))
    );
  }

  protected loggedInUserId(): Observable<string> {
    return this.userIdService.takeUserId().pipe(
      take(1),
      switchMap((userId) => {
        if (!userId || userId === 'anonymous') {
          throw new Error('Subscriptions require a logged-in customer');
        }
        return [userId];
      })
    );
  }
}
