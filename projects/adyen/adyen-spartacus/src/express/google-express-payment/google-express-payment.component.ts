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
import {Observable, of, Subscription, last} from 'rxjs';
import {catchError, filter, map, switchMap, take} from 'rxjs/operators';
import {AdyenCartService} from "../../service/adyen-cart-service";


@Component({
  selector: 'cx-google-express-payment',
  standalone: true,
  imports: [CommonModule, GooglePayButtonModule],
  templateUrl: './google-express-payment.component.html',
  styleUrls: ['./google-express-payment.component.css']
})
export class GoogleExpressPaymentComponent implements OnInit, OnDestroy{

  protected subscriptions = new Subscription();

  @Input()
  product: Product;

  @Input()
  configuration: AdyenExpressConfigData;

  googlePay: GooglePay;

  private authorizedPaymentData: any;

  constructor(
    protected adyenOrderService: AdyenExpressOrderService,
    protected routingService: RoutingService,
    protected activeCartService: ActiveCartFacade,
    protected multiCartService: MultiCartFacade,
    private userIdService: UserIdService,
    protected adyenCartService: AdyenCartService,
  ) {}


  deliveryModes: DeliveryMode[] = [];

  getSupportedDeliveryModesState(cartId: string): Observable<DeliveryMode[]> {
    return this.adyenCartService.getSupportedDeliveryModesStateForCart(cartId).pipe(
      map((state) => state.data || []),
      catchError(() => of([]))
    );
  }

  productAdded = false;
  cart: Cart;
  activeCart: Cart;
  cart$: Observable<Cart>;
  ngOnInit(): void {


    if (!this.product) {
      this.activeCartService.getActive().subscribe(activeCart => {
        this.cart = activeCart;
        this.setupAdyenCheckout(this.configuration);
      })
      return;
    }
    this.activeCartService.getActive().subscribe(activeCart => {
      this.activeCart = activeCart;
    })

    let userId: string;

    this.userIdService
      .takeUserId()
      .pipe(
        // Optionally filter out falsy user IDs if userId can initially be empty
        filter((id) => !!id),
        // Take only the first emission from userIdService
        take(1),
        switchMap((uid) => {
          userId = uid;
          // Create a cart for this user (once)
          return this.multiCartService.createCart({
            userId,
            oldCartId: undefined,
            toMergeCartGuid: undefined,
            extraData: { active: false },
          });
        })
      )
      .subscribe((cart) => {
        // Add an entry to the newly created cart (once)
        if (!this.productAdded && cart.code) {
          this.multiCartService.addEntry(
            userId,
            cart?.code || '',
            this.product.code || '',
            1,
            undefined
          );
          this.cart = cart;
          this.productAdded = true;
          this.cart$ = this.multiCartService.getCart(cart.code)
        } else {
          console.log("Can't add product or create cart!")
        }
        this.setupAdyenCheckout(this.configuration);
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.googlePay) {
      this.googlePay.unmount();
    }
  }

  private async setupAdyenCheckout(config: AdyenExpressConfigData) {

    //if(!!this.cart && this.cart.code) {
      this.getSupportedDeliveryModesState(this.cart?.code || '').subscribe((deliveryModes) => {
        this.deliveryModes = deliveryModes;
      });

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
          countryCode: 'US'
        },
        onSubmit: (state: any, element: UIElement, actions) => this.handleOnSubmit(state, actions),
        paymentDataCallbacks: {
          onPaymentDataChanged: async (intermediatePaymentData) => {
            return new Promise(async resolve => {
              const {callbackTrigger, shippingAddress, shippingOptionData} = intermediatePaymentData;
              const paymentDataRequestUpdate: google.payments.api.PaymentDataRequestUpdate = {};
              if (callbackTrigger === 'INITIALIZE') {
                if (shippingAddress) {
                  this.adyenCartService.createAndSetAddress(this.cart?.code || '', {
                    postalCode: shippingAddress.postalCode,
                    country: {isocode: shippingAddress.countryCode},
                    firstName: "placeholder",
                    lastName: "placeholder",
                    town: "placeholder",
                    line1: "placeholder"
                  }).subscribe(
                    (result) => {
                      this.getSupportedDeliveryModesState(this.cart?.code || '').subscribe((deliveryModes) => {
                        if(deliveryModes.length>0) {
                          this.deliveryModes = deliveryModes;
                          paymentDataRequestUpdate.newShippingOptionParameters = {
                            defaultSelectedOptionId: this.deliveryModes[0]?.code || "",
                            shippingOptions: this.deliveryModes.map(mode => ({
                              id: mode.code || "",
                              label: mode.name || "",
                              description: mode.description || ""
                            }))
                          }
                          resolve(paymentDataRequestUpdate);
                        }
                      });
                    }
                  );
                }
              }

              if (callbackTrigger === 'SHIPPING_ADDRESS' && !!shippingAddress) {
                this.adyenCartService.createAndSetAddress(this.cart?.code || '', {
                  postalCode: shippingAddress.postalCode,
                  country: {isocode: shippingAddress.countryCode},
                  firstName: "placeholder",
                  lastName: "placeholder",
                  town: "placeholder",
                  line1: "placeholder"
                }).subscribe(
                  () => {

                    this.getSupportedDeliveryModesState(this.cart?.code || '').subscribe((deliveryModes) => {
                      this.deliveryModes = deliveryModes;

                      this.adyenCartService
                        .setDeliveryMode(this.deliveryModes[0]?.code || "", this.cart?.code || "")
                        .pipe(
                          switchMap(() => !!this.product ? this.adyenCartService.takeStable(this.cart$) : this.activeCartService.takeActive())
                        ).subscribe({
                        next: cart => {
                          paymentDataRequestUpdate.newShippingOptionParameters = {
                            defaultSelectedOptionId: this.deliveryModes[0]?.code || "",
                            shippingOptions: this.deliveryModes.map(mode => ({
                              id: mode.code || "",
                              label: mode.name || "",
                              description: mode.description || ""
                            }))
                          }
                          paymentDataRequestUpdate.newTransactionInfo = {
                            countryCode: 'US',
                            currencyCode: cart.totalPriceWithTax?.currencyIso ?? '',
                            totalPriceStatus: 'FINAL',
                            totalPrice: (cart.totalPriceWithTax?.value ?? 0).toString(),
                            totalPriceLabel: 'Total'
                          };
                          resolve(paymentDataRequestUpdate);
                        },
                        error: err => {
                          console.error('Error updating delivery mode:', err);
                        },
                      });
                    });
                  }
                );
              }

              if (callbackTrigger === 'SHIPPING_OPTION') {
                if (shippingOptionData) {
                  this.adyenCartService
                    .setDeliveryMode(shippingOptionData.id, this.cart?.code || "")
                    .pipe(
                      switchMap(() => !!this.product ? this.adyenCartService.takeStable(this.cart$) : this.activeCartService.takeActive())
                    ).subscribe({
                    next: cart => {
                      paymentDataRequestUpdate.newTransactionInfo = {
                        countryCode: 'US',
                        currencyCode: cart.totalPriceWithTax?.currencyIso ?? '',
                        totalPriceStatus: 'FINAL',
                        totalPrice: (cart.totalPriceWithTax?.value ?? 0).toString(),
                        totalPriceLabel: 'Total'
                      };
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
    //}
  }

  private handleOnSubmit(state: any, actions: any) {
    this.adyenOrderService.adyenPlaceGoogleExpressOrder(state.data, this.authorizedPaymentData, this.product).subscribe(
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
}
