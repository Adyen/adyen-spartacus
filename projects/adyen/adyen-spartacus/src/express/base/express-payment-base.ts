import {Injectable, OnDestroy} from "@angular/core";
import {Product, UserIdService} from '@spartacus/core';
import {ActiveCartFacade, Cart, DeliveryMode, MultiCartFacade} from '@spartacus/cart/base/root';
import {firstValueFrom, Observable, of, Subject} from 'rxjs';
import {catchError, filter, map, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {AdyenCartService} from "../../service/adyen-cart-service";


@Injectable()
export class ExpressPaymentBase implements OnDestroy {

  constructor(protected multiCartService: MultiCartFacade,
              protected userIdService: UserIdService,
              protected activeCartService: ActiveCartFacade,
              protected adyenCartService: AdyenCartService) {

  }

  private unsubscribe$ = new Subject<void>();

  productAdded = false;
  cartId: string;
  cart$!: Observable<Cart>;


  async initializeCart(product: Product): Promise<void> {
    try {
      const activeCart = await firstValueFrom(
        this.activeCartService.getActive().pipe(
          take(1),
          catchError((error) => {
            console.error("Error fetching the active cart:", error);
            return of(null); // Ensure chain does not terminate
          })
        )
      );

      if (!activeCart) {
        console.warn("No active cart found, emitting null.");
        return; // Gracefully handle missing active cart
      }

      console.log("init cart")

      if (!this.cartId) {
        console.log("empty cart id, initializing with product: " + product.code)

        const cart = product
          ? await firstValueFrom(this.createAndAddProductToCart(product))
          : activeCart;


        if (cart && cart.code) {
          this.cart$ = this.multiCartService.getCart(cart.code);
          this.cartId = cart.code;

        } else {
          console.warn("Cart not available or invalid.");
        }
      }
    } catch (error) {
      console.error("Error in async cart initialization:", error);
    }
  }

  private createAndAddProductToCart(product: Product): Observable<Cart> {
    return this.userIdService.takeUserId().pipe(
      filter(userId => !!userId), // Ensure we have a valid user ID
      take(1),
      takeUntil(this.unsubscribe$),
      switchMap((userId) =>
        this.multiCartService.createCart({
          userId,
          extraData: {active: false},
        }).pipe(
          tap((cart) => {
            if (!this.productAdded) {
              if (cart && cart.code && product?.code) {
                // Call addEntry here, as it does not return an Observable
                this.multiCartService.addEntry(userId, cart.code, product.code, 1);
                this.productAdded = true;
              } else {
                console.error("Unable to add product or cart is invalid.");
              }
            }
          }),
          map((cart) => cart) // Forward the cart in the pipeline
        )
      )
    )
  }

  getSupportedDeliveryModesState(cartId: string): Observable<DeliveryMode[]> {
    return this.adyenCartService.getSupportedDeliveryModesStateForCart(cartId).pipe(
      map((state) => state.data || []),
      catchError(() => of([]))
    );
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
