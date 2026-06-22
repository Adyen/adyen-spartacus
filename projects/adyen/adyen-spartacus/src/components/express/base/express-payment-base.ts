import {inject, Injectable, OnDestroy} from "@angular/core";
import {Address, EventService, Product, RoutingService, UserIdService} from '@spartacus/core';
import {ActiveCartFacade, Cart, DeliveryMode, MultiCartFacade} from '@spartacus/cart/base/root';
import {firstValueFrom, Observable, of, Subject, Subscription} from 'rxjs';
import {catchError, filter, map, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {AdyenCartService} from "../../../core/services/adyen-cart-service";
import {AdyenLoggerService} from "../../../core/services/adyen-logger.service";

@Injectable()
export class ExpressPaymentBase implements OnDestroy {
  private unsubscribe$ = new Subject<void>();
  protected subscriptions = new Subscription();
  protected logger = inject(AdyenLoggerService);

  protected productAdded = false;
  protected cartId: string | undefined;
  protected cart$?: Observable<Cart>;

  constructor(
    protected multiCartService: MultiCartFacade,
    protected userIdService: UserIdService,
    protected activeCartService: ActiveCartFacade,
    protected adyenCartService: AdyenCartService,
    protected eventService: EventService,
    protected routingService: RoutingService
  ) {}

  async initializeCart(product: Product): Promise<void> {
    try {
      const activeCart = await firstValueFrom(
        this.activeCartService.getActive().pipe(
          take(1),
          catchError((error) => {
            this.logger.error("Error fetching the active cart:", error);
            throw error;
          })
        )
      );

      if (!activeCart) {
        this.logger.warn("No active cart found, emitting null.");
        return; // Gracefully handle missing active cart
      }


      if (!this.cartId) {
        const cart = product
          ? await firstValueFrom(this.createAndAddProductToCart(product))
          : activeCart;

        if (cart?.code) {
          this.cart$ = this.multiCartService.getCart(cart.code);

          if (product) {
            await firstValueFrom(this.adyenCartService.takeStable(this.cart$));
          }

          this.cartId = cart.code;
        } else {
          this.logger.warn("Cart not available or invalid.");
        }
      }
    } catch (error) {
      this.logger.error("Error in async cart initialization:", error);
    }
  }

  protected getStableCart(product?: Product): Observable<Cart> {
    if (product) {
      if (!this.cart$) {
        throw new Error('cart$ is undefined for express product cart');
      }

      return this.adyenCartService.takeStable(this.cart$);
    }

    return this.activeCartService.takeActive();
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
              if (cart && (cart as Cart).code && product?.code) {
                // Call addEntry here, as it does not return an Observable
                this.multiCartService.addEntry(userId, (cart as Cart).code as string, product.code, 1);
                this.productAdded = true;
              } else {
                this.logger.error("Unable to add product or cart is invalid.");
              }
            }
          }),
          map((cart) => cart) // Forward the cart in the pipeline
        )
      )
    )
  }


  setDeliveryMode<T>(deliveryModeId: string, product: Product, mappingFunction: (cart: Cart) => T, resolve: any, reject: any): void {
    if(!!this.cartId) {
      this.subscriptions.add(this.adyenCartService.setDeliveryMode(deliveryModeId, this.cartId)
        .pipe(
          switchMap(() => this.getStableCart(product))
        ).subscribe({
          next: cart => {
            try {
              const update = mappingFunction(cart);

              resolve(update)
            } catch (e) {
              this.logger.error("Delivery mode selection issue")
              reject();
            }
          },
          error: err => {
            this.logger.error('Error updating delivery mode:', err);
            reject()
          },
        }));
    } else {
      this.logger.error("Undefined cart id")
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
        this.subscriptions.add(this.adyenCartService.getSupportedDeliveryModesForCart(cartCode).subscribe((deliveryModes) => {
          const validDeliveryModes = deliveryModes.filter(mode => mode.code);

          if (validDeliveryModes.length > 0) {
            this.subscriptions.add(this.adyenCartService
              .setDeliveryMode(validDeliveryModes[0].code!, cartCode)
              .pipe(
                switchMap(() => this.getStableCart(product))
              ).subscribe({
                next: cart => {
                  try {
                    let update = mappingFunction(cart, validDeliveryModes);

                    resolve(update);
                  } catch (e) {
                    this.logger.error("Delivery mode mapping issue")
                    reject();
                  }
                },
                error: err => {
                  this.logger.error('Error updating delivery mode:', err);
                  reject()
                },
              }));
          }
        }))
      }))
    } else{
      this.logger.error("Undefined cart id")
    }
  }

  onSuccess(): void {
    this.removeCurrentCart();
    this.clearState();

    this.routingService.go({ cxRoute: 'orderConfirmation' });
  }

  protected removeCurrentCart(): void {
    if (this.cartId) {
      this.multiCartService.removeCart(this.cartId);
    }
  }

  protected clearState(): void {
    this.cartId = undefined;
    this.cart$ = undefined;
    this.productAdded = false;
  }

  ngOnDestroy(): void {
    this.clearState();
    this.subscriptions.unsubscribe();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
