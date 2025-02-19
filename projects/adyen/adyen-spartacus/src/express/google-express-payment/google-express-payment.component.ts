import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GooglePayButtonModule} from '@google-pay/button-angular';
import {UIElement} from "@adyen/adyen-web";
import {AdyenCheckout, AdyenCheckoutError, GooglePay} from '@adyen/adyen-web/auto';
import {AdyenExpressConfigData} from "../../core/models/occ.config.models";
import {AdyenExpressOrderService} from "../../service/adyen-express-order.service";
import {Product, RoutingService,UserIdService} from '@spartacus/core';
import {ActiveCartFacade, Cart, DeliveryMode,MultiCartFacade} from '@spartacus/cart/base/root';
import {getAdyenExpressCheckoutConfig} from "../adyenCheckoutConfig.util";
import {Observable, of,Subject, firstValueFrom, last} from 'rxjs';
import { filter, map,tap, switchMap, take, takeUntil, catchError } from 'rxjs/operators';
import {AdyenCartService} from "../../service/adyen-cart-service";


@Component({
  selector: 'cx-google-express-payment',
  standalone: true,
  imports: [CommonModule, GooglePayButtonModule],
  templateUrl: './google-express-payment.component.html',
  styleUrls: ['./google-express-payment.component.css']
})
export class GoogleExpressPaymentComponent implements OnInit, OnDestroy{

  private unsubscribe$ = new Subject<void>();

  @Input() product: Product;

  @Input() configuration: AdyenExpressConfigData;

  cart$!: Observable<Cart>;
  deliveryModes$: Observable<DeliveryMode[]> = of([]);
  productAdded = false;
  googlePay!: GooglePay;
  cartId: string;

  private authorizedPaymentData: any;

  constructor(
    protected adyenOrderService: AdyenExpressOrderService,
    protected routingService: RoutingService,
    protected activeCartService: ActiveCartFacade,
    protected multiCartService: MultiCartFacade,
    private userIdService: UserIdService,
    protected adyenCartService: AdyenCartService,
  ) {}

  ngOnInit(): void {
    this.initializeGooglePay();
  }

  private async initializeCart(): Promise<void> {
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

      const cart = this.product
        ? await firstValueFrom(this.createAndAddProductToCart())
        : activeCart;

      if (!this.cartId) {
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

  private createAndAddProductToCart(): Observable<Cart> {
    return this.userIdService.takeUserId().pipe(
      filter(userId => !!userId), // Ensure we have a valid user ID
      take(1),
      takeUntil(this.unsubscribe$),
      switchMap((userId) =>
        this.multiCartService.createCart({
          userId,
          extraData: { active: false },
        }).pipe(
          tap((cart) => {
            if(!this.productAdded) {
              if (cart && cart.code && this.product?.code) {
                // Call addEntry here, as it does not return an Observable
                this.multiCartService.addEntry(userId, cart.code, this.product.code, 1);
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

  private initializeGooglePay(): void {
    if (this.configuration) {
      this.setupAdyenCheckout(this.configuration); // Existing logic encapsulated into functions.
    }
  }
  deliveryModes: DeliveryMode[] = [];

  getSupportedDeliveryModesState(cartId: string): Observable<DeliveryMode[]> {
    return this.adyenCartService.getSupportedDeliveryModesStateForCart(cartId).pipe(
      map((state) => state.data || []),
      catchError(() => of([]))
    );
  }

  private async setupAdyenCheckout(config: AdyenExpressConfigData) {

      const adyenCheckout = await AdyenCheckout(getAdyenExpressCheckoutConfig(config));

      if (this.googlePay) {
        this.googlePay.unmount();
      }

      this.googlePay = new GooglePay(adyenCheckout, {
        callbackIntents: ['SHIPPING_ADDRESS', 'SHIPPING_OPTION'],
        shippingAddressRequired: true,
        shippingOptionRequired: true,
        emailRequired: true,
        shippingAddressParameters: {
          allowedCountryCodes: [],
          phoneNumberRequired: false
        },
        isExpress: true,
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPriceLabel: 'Total',
          totalPrice: config.amountDecimal.toString(),
          currencyCode: config.amount.currency,
          countryCode: undefined,
        },
        onSubmit: (state: any, element: UIElement, actions) => this.handleOnSubmit(state, actions),
        paymentDataCallbacks: {
          onPaymentDataChanged: async (intermediatePaymentData) => {
            return new Promise(async resolve => {
              const {callbackTrigger, shippingAddress, shippingOptionData} = intermediatePaymentData;
              const paymentDataRequestUpdate: google.payments.api.PaymentDataRequestUpdate = {};

              if(callbackTrigger === 'INITIALIZE'){
                await this.initializeCart();
              }

              if (callbackTrigger === 'INITIALIZE' || callbackTrigger === 'SHIPPING_ADDRESS') {
                if (shippingAddress) {
                  this.adyenCartService.createAndSetAddress(this.cartId, {
                    postalCode: shippingAddress.postalCode,
                    country: {isocode: shippingAddress.countryCode},
                    firstName: "placeholder",
                    lastName: "placeholder",
                    town: "placeholder",
                    line1: "placeholder"
                  }).subscribe(
                    (result) => {
                      this.getSupportedDeliveryModesState(this.cartId).subscribe((deliveryModes) => {
                        const validDeliveryModes = deliveryModes.filter(mode => mode.code);
                        if(validDeliveryModes.length > 0) {
                          this.adyenCartService
                            .setDeliveryMode(deliveryModes[0].code || "", this.cartId)
                            .pipe(
                              switchMap(() => !!this.product ? this.adyenCartService.takeStable(this.cart$) : this.activeCartService.takeActive())
                            ).subscribe({
                            next: cart => {
                              this.updateShippingOptions(paymentDataRequestUpdate, validDeliveryModes);
                              this.updateTransactionInfo(paymentDataRequestUpdate, cart);
                              resolve(paymentDataRequestUpdate);
                            },
                            error: err => {
                              console.error('Error updating delivery mode:', err);
                            },
                          });
                        }else {
                          console.error('No delivery mode found');
                        }
                      });
                    }
                  );
                }
              }

              if (callbackTrigger === 'SHIPPING_OPTION') {
                if (shippingOptionData) {
                  this.adyenCartService
                    .setDeliveryMode(shippingOptionData.id, this.cartId)
                    .pipe(
                      switchMap(() => !!this.product ? this.adyenCartService.takeStable(this.cart$) : this.activeCartService.takeActive())
                    ).subscribe({
                    next: cart => {
                      this.updateTransactionInfo(paymentDataRequestUpdate, cart);
                      resolve(paymentDataRequestUpdate);
                    },
                    error: err => {
                      console.error('Error updating delivery mode:', err);
                    },
                  });
                }
              }
            });
          },
        },
        onAuthorized: (paymentData, actions) => {
          this.authorizedPaymentData = paymentData;
          actions.resolve();
        },
        onError: (error) => this.handleError(error)
      }).mount("#google-pay-button");
  }

  private updateShippingOptions(paymentDataRequestUpdate: google.payments.api.PaymentDataRequestUpdate, deliveryModes: DeliveryMode[]) {
    paymentDataRequestUpdate.newShippingOptionParameters = {
      defaultSelectedOptionId: deliveryModes[0].code,
      shippingOptions: deliveryModes.map(mode => ({
        id: mode.code!,
        label: mode.name || "",
        description: mode.description || ""
      }))
    }
  }

  private updateTransactionInfo(paymentDataRequestUpdate: google.payments.api.PaymentDataRequestUpdate, cart: Cart) {
    if (
      !cart.totalPriceWithTax?.currencyIso ||
      !cart.totalPriceWithTax?.value
    ) {
      throw new Error("Missing required values.");
    }

    paymentDataRequestUpdate.newTransactionInfo = {
      countryCode: undefined,
      currencyCode: cart.totalPriceWithTax.currencyIso,
      totalPriceStatus: 'FINAL',
      totalPrice: cart.totalPriceWithTax.value.toString(),
      totalPriceLabel: 'Total'
    };

  }

  private handleOnSubmit(state: any, actions: any) {
    this.adyenOrderService.adyenPlaceGoogleExpressOrder(state.data, this.authorizedPaymentData, this.product, this.cartId).subscribe(
      result => {
        if (result?.success) {
          if (result.executeAction && result.paymentsAction !== undefined) {
            this.googlePay.handleAction(result.paymentsAction);
          } else {
            this.onSuccess();
          }
        } else {
          console.error(result?.error);
          actions.reject();
        }
        actions.resolve({ resultCode: 'Authorised' });
      },
      error => {
        console.error(error);
        actions.reject();
      }
    );
  }

  handleError(error: AdyenCheckoutError) {}

  onSuccess(): void {
    this.routingService.go({ cxRoute: 'orderConfirmation' });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    if (this.googlePay) {
      this.googlePay.unmount();
    }
  }


}
