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
import {ExpressPaymentBase} from "../base/express-payment-base";


@Component({
  selector: 'cx-google-express-payment',
  standalone: true,
  imports: [CommonModule, GooglePayButtonModule],
  templateUrl: './google-express-payment.component.html',
  styleUrls: ['./google-express-payment.component.css']
})
export class GoogleExpressPaymentComponent extends ExpressPaymentBase implements OnInit, OnDestroy{

  @Input() product: Product;

  @Input() configuration: AdyenExpressConfigData;


  googlePay!: GooglePay;

  private authorizedPaymentData: any;

  constructor(
    protected adyenOrderService: AdyenExpressOrderService,
    protected routingService: RoutingService,
    protected override activeCartService: ActiveCartFacade,
    protected override multiCartService: MultiCartFacade,
    protected override userIdService: UserIdService,
    protected override adyenCartService: AdyenCartService,
  ) {
    super(multiCartService, userIdService, activeCartService, adyenCartService)
  }

  ngOnInit(): void {
    this.initializeGooglePay();
  }


  private initializeGooglePay(): void {
    if (this.configuration) {
      this.setupAdyenCheckout(this.configuration); // Existing logic encapsulated into functions.
    }
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
          countryCode: 'US'
        },
        onSubmit: (state: any, element: UIElement, actions) => this.handleOnSubmit(state, actions),
        paymentDataCallbacks: {
          onPaymentDataChanged: async (intermediatePaymentData) => {
            return new Promise(async resolve => {
              const {callbackTrigger, shippingAddress, shippingOptionData} = intermediatePaymentData;
              const paymentDataRequestUpdate: google.payments.api.PaymentDataRequestUpdate = {};

              if(callbackTrigger === 'INITIALIZE'){
                await this.initializeCart(this.product);
              }

              if (callbackTrigger === 'INITIALIZE' || callbackTrigger === 'SHIPPING_ADDRESS') {
                if (shippingAddress && !!this.cartId) {
                  const cartCode = this.cartId;
                  this.adyenCartService.createAndSetAddress(cartCode, {
                    postalCode: shippingAddress.postalCode,
                    country: {isocode: shippingAddress.countryCode},
                    firstName: "placeholder",
                    lastName: "placeholder",
                    town: "placeholder",
                    line1: "placeholder"
                  }).subscribe(
                    (result) => {
                      this.getSupportedDeliveryModesState(cartCode).subscribe((deliveryModes) => {
                        if (deliveryModes.length > 0) {
                          this.adyenCartService
                            .setDeliveryMode(deliveryModes[0]?.code || "", cartCode)
                            .pipe(
                              switchMap(() => !!this.product ? this.adyenCartService.takeStable(this.cart$) : this.activeCartService.takeActive())
                            ).subscribe({
                            next: cart => {
                              this.updateShippingOptions(paymentDataRequestUpdate, deliveryModes);
                              this.updateTransactionInfo(paymentDataRequestUpdate, cart);
                              resolve(paymentDataRequestUpdate);
                            },
                            error: err => {
                              console.error('Error updating delivery mode:', err);
                            },
                          });
                        }
                      });
                    }
                  );
                }
              } else {
                console.error("Undefined cart id")
              }

              if (callbackTrigger === 'SHIPPING_OPTION') {
                if (shippingOptionData && !!this.cartId) {
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
                } else {
                  console.error("Undefined cart id")
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
      defaultSelectedOptionId: deliveryModes[0]?.code || "",
      shippingOptions: deliveryModes.map(mode => ({
        id: mode.code || "",
        label: mode.name || "",
        description: mode.description || ""
      }))
    }
  }

  private updateTransactionInfo(paymentDataRequestUpdate: google.payments.api.PaymentDataRequestUpdate, cart: Cart) {
    paymentDataRequestUpdate.newTransactionInfo = {
      countryCode: 'US',
      currencyCode: cart.totalPriceWithTax?.currencyIso ?? '',
      totalPriceStatus: 'FINAL',
      totalPrice: (cart.totalPriceWithTax?.value ?? 0).toString(),
      totalPriceLabel: 'Total'
    };
  }

  private handleOnSubmit(state: any, actions: any) {
    if(!!this.cartId) {
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
          actions.resolve({resultCode: 'Authorised'});
        },
        error => {
          console.error(error);
          actions.reject();
        }
      );
    } else {
      console.error("Undefined cart id")
    }
  }

  handleError(error: AdyenCheckoutError) {}

  onSuccess(): void {
    this.routingService.go({ cxRoute: 'orderConfirmation' });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.googlePay) {
      this.googlePay.unmount();
    }
  }


}
