import {Injectable, OnDestroy} from "@angular/core";
import {Address, EventService, Product, UserIdService} from '@spartacus/core';
import {ActiveCartFacade, Cart, DeliveryMode, MultiCartFacade} from '@spartacus/cart/base/root';
import {firstValueFrom, Observable, of, Subject, Subscription} from 'rxjs';
import {catchError, filter, map, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {AdyenCartService} from "../../service/adyen-cart-service";
import {ExpressCheckoutSuccessfulEvent} from "../../events/checkout-adyen.events";


@Injectable()
export class ExpressPaymentBase implements OnDestroy {

  constructor(protected multiCartService: MultiCartFacade,
              protected userIdService: UserIdService,
              protected activeCartService: ActiveCartFacade,
              protected adyenCartService: AdyenCartService,
              protected eventService: EventService) {
    this.cleanupCart();
  }

  protected cleanupCart(): void {
    this.subscriptions.add(this.eventService.get(ExpressCheckoutSuccessfulEvent).subscribe(event => {
      if (this.cartId) {
        this.multiCartService.removeCart(this.cartId);
      }
      this.cartId = undefined;
    }));
  }

  private unsubscribe$ = new Subject<void>();
  protected subscriptions = new Subscription();

  productAdded = false;
  cartId: string | undefined;
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


      if (!this.cartId) {
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

  setDeliveryMode<T>(deliveryModeId: string, product: Product, mappingFunction: (cart: Cart) => T, resolve: any, reject: any): void {
    if(!!this.cartId) {
      this.subscriptions.add(this.adyenCartService.setDeliveryMode(deliveryModeId, this.cartId)
        .pipe(
          switchMap(() => !!product ? this.adyenCartService.takeStable(this.cart$) : this.activeCartService.takeActive())
        ).subscribe({
          next: cart => {
            try {
              const update = mappingFunction(cart);

              resolve(update)
            } catch (e) {
              console.error("Delivery mode selection issue")
              reject();
            }
          },
          error: err => {
            console.error('Error updating delivery mode:', err);
            reject()
          },
        }));
    } else {
      console.error("Undefined cart id")
    }
  }

  async handleShippingContactSelected<T>(address: {
    postalCode: string,
    countryCode: string
  }, product: Product, mappingFunction: (cart: Cart, deliveryModes: DeliveryMode[]) => T, resolve: any, reject: any): Promise<void> {
    await this.initializeCart(product);
    const shippingAddress: Address = {
      postalCode: address.postalCode,
      country: {isocode: address.countryCode},
      firstName: "placeholder",
      lastName: "placeholder",
      town: "placeholder",
      line1: "placeholder"
    }
    if(!!this.cartId) {
      const cartCode = this.cartId;
      this.subscriptions.add(this.adyenCartService.createAndSetAddress(cartCode, shippingAddress).subscribe(() => {
        this.subscriptions.add(this.getSupportedDeliveryModesState(cartCode).subscribe((deliveryModes) => {
          const validDeliveryModes = deliveryModes.filter(mode => mode.code);

          if (validDeliveryModes.length > 0) {
            this.subscriptions.add(this.adyenCartService
              .setDeliveryMode(validDeliveryModes[0].code!, cartCode)
              .pipe(
                switchMap(() => !!product ? this.adyenCartService.takeStable(this.cart$) : this.activeCartService.takeActive())
              ).subscribe({
                next: cart => {
                  try {
                    let update = mappingFunction(cart, validDeliveryModes);

                    resolve(update);
                  } catch (e) {
                    console.error("Delivery mode mapping issue")
                    reject();
                  }
                },
                error: err => {
                  console.error('Error updating delivery mode:', err);
                  reject()
                },
              }));
          }
        }))
      }))
    } else{
      console.error("Undefined cart id")
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
