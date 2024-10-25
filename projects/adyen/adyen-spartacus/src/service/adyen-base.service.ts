import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { UserIdService } from '@spartacus/core';
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { map, take } from 'rxjs/operators';

@Injectable()
export class AdyenBaseService {
  constructor(
    protected userIdService: UserIdService,
    protected activeCartFacade: ActiveCartFacade
  ) {}

  protected checkoutPreconditions(): Observable<[string, string]> {
    return combineLatest([
      this.userIdService.takeUserId(),
      this.activeCartFacade.takeActiveCartId(),
      this.activeCartFacade.isGuestCart(),
    ]).pipe(
      take(1),
      map(([userId, cartId, isGuestCart]) => {
        if (
          !userId ||
          !cartId ||
          (userId === 'anonymous' && !isGuestCart)
        ) {
          throw new Error('Checkout conditions not met');
        }
        return [userId, cartId];
      })
    );
  }
}
