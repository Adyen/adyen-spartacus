import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { UserIdService } from '@spartacus/core';
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable()
export class AdyenBaseService {
  constructor(
    protected userIdService: UserIdService,
    protected activeCartFacade: ActiveCartFacade
  ) {}

  protected checkoutPreconditions(): Observable<[string, string]> {
    return this.userIdService.takeUserId().pipe(
        switchMap((userId) =>
            combineLatest([
                this.activeCartFacade.takeActiveCartId(),
                this.activeCartFacade.isGuestCart(),
            ]).pipe(
                take(1),
                map(([cartId, isGuestCart]) => {
                    if (
                        !userId ||
                        !cartId ||
                        (userId === 'anonymous' && !isGuestCart)
                    ) {
                        throw new Error('Checkout conditions not met');
                    }
                    return [userId, cartId] as [string, string];
                })
            )
        )
    );
  }
}
