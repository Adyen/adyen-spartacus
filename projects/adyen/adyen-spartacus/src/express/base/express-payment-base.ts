import {Injectable, OnDestroy} from "@angular/core";
import {Address, EventService, Product, RoutingService, UserIdService} from '@spartacus/core';
import {ActiveCartFacade, Cart, DeliveryMode, MultiCartFacade} from '@spartacus/cart/base/root';
import {firstValueFrom, Observable, of, Subject, Subscription} from 'rxjs';
import {catchError, filter, map, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {AdyenCartService} from "../../service/adyen-cart-service";

@Injectable()
export class ExpressPaymentBase implements OnDestroy {

  constructor(protected multiCartService: MultiCartFacade,
              protected userIdService: UserIdService,
              protected activeCartService: ActiveCartFacade,
              protected adyenCartService: AdyenCartService,
              protected eventService: EventService,
              protected routingService: RoutingService) {
  }

  private unsubscribe$ = new Subject<void>();
  protected subscriptions = new Subscription();

  static productAdded = false;
  static cartId: string | undefined;
  static cart$: Observable<Cart>;


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


      if (!ExpressPaymentBase.cartId) {
        const cart = product
          ? await firstValueFrom(this.createAndAddProductToCart(product))
          : activeCart;


        if (cart && cart.code) {
          ExpressPaymentBase.cart$ = this.multiCartService.getCart(cart.code);
          ExpressPaymentBase.cartId = cart.code;

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
            if (!ExpressPaymentBase.productAdded) {
              if (cart && cart.code && product?.code) {
                // Call addEntry here, as it does not return an Observable
                this.multiCartService.addEntry(userId, cart.code, product.code, 1);
                ExpressPaymentBase.productAdded = true;
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


  setDeliveryMode<T>(deliveryModeId: string, product: Product, mappingFunction: (cart: Cart) => T, resolve: any, reject: any): void {
    if(!!ExpressPaymentBase.cartId) {
      this.subscriptions.add(this.adyenCartService.setDeliveryMode(deliveryModeId, ExpressPaymentBase.cartId)
        .pipe(
          switchMap(() => !!product ? this.adyenCartService.takeStable(ExpressPaymentBase.cart$) : this.activeCartService.takeActive())
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
    if(!!ExpressPaymentBase.cartId) {
      const cartCode = ExpressPaymentBase.cartId;
      this.subscriptions.add(this.adyenCartService.createAndSetAddress(cartCode, shippingAddress).subscribe(() => {
        this.subscriptions.add(this.adyenCartService.getSupportedDeliveryModesForCart(cartCode).subscribe((deliveryModes) => {
          const validDeliveryModes = deliveryModes.filter(mode => mode.code);

          if (validDeliveryModes.length > 0) {
            this.subscriptions.add(this.adyenCartService
              .setDeliveryMode(validDeliveryModes[0].code!, cartCode)
              .pipe(
                switchMap(() => !!product ? this.adyenCartService.takeStable(ExpressPaymentBase.cart$) : this.activeCartService.takeActive())
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

  onSuccess(): void {
    if (ExpressPaymentBase.cartId) {
      this.multiCartService.removeCart(ExpressPaymentBase.cartId);
    }
    ExpressPaymentBase.cartId = undefined;
    ExpressPaymentBase.productAdded = false;

    this.routingService.go({cxRoute: 'orderConfirmation'});
  }


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
