import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AdditionalDetailsActions, SubmitActions, SubmitData, UIElement} from "@adyen/adyen-web";
import {AdyenCheckout, AdyenCheckoutError, Intent, PayPal} from '@adyen/adyen-web/auto';
import {AdyenExpressConfigData} from "../../core/models/occ.config.models";
import {AdyenExpressOrderService} from "../../service/adyen-express-order.service";
import {Address, EventService, Product, RoutingService, UserIdService,} from '@spartacus/core';
import {ActiveCartFacade, Cart, DeliveryMode, MultiCartFacade} from '@spartacus/cart/base/root';
import {getAdyenExpressCheckoutConfig} from "../adyenCheckoutConfig.util";
import {PaypalExpressService} from "../service/paypal-express.service";
import {ExpressPaymentBase} from "../base/express-payment-base";
import {AdyenCartService} from "../../service/adyen-cart-service";
import {switchMap} from 'rxjs/operators';
import {
  PaypalUpdateOrderResponse,
  PlaceOrderResponse
} from "../../core/models/occ.order.models";
import {Observable, firstValueFrom} from 'rxjs';
import {AmountUtil} from "../../utils/amount-util";
import {ExpressCheckoutWithAdditionalDetailsSuccessfulEvent} from "../../events/checkout-adyen.events";


@Component({
  selector: 'cx-paypal-express-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paypal-express-payment.component.html',
  styleUrls: ['./paypal-express-payment.component.css']
})
export class PaypalExpressPaymentComponent extends ExpressPaymentBase implements OnInit, OnDestroy {

  @Input()
  product: Product;

  @Input()
  configuration: AdyenExpressConfigData;

  paypal: PayPal;

  private authorizedPaymentData: any;

  pspReference: string;

  deliveryModes: DeliveryMode[];

  constructor(
    protected adyenOrderService: AdyenExpressOrderService,
    protected routingService: RoutingService,
    protected activeCartFacade: ActiveCartFacade,
    protected paypalExpressService: PaypalExpressService,
    protected override activeCartService: ActiveCartFacade,
    protected override multiCartService: MultiCartFacade,
    protected override userIdService: UserIdService,
    protected override adyenCartService: AdyenCartService,
    protected override eventService: EventService
  ) {
    super(multiCartService, userIdService, activeCartService, adyenCartService, eventService)
  }

  protected override cleanupCart(): void {
    this.subscriptions.add(this.eventService.get(ExpressCheckoutWithAdditionalDetailsSuccessfulEvent).subscribe(event => {
      if (this.cartId) {
        this.multiCartService.removeCart(this.cartId);
      }
      this.cartId = undefined;
    }));
  }

  ngOnInit(): void {
    this.initialize();
  }

  initialize() {
    if (this.configuration) {
      this.setupAdyenCheckout(this.configuration);
    }
  }

  protected async setupAdyenCheckout(config: AdyenExpressConfigData) {

    try {
      const adyenCheckout = await AdyenCheckout(getAdyenExpressCheckoutConfig(config));

      if (config.expressPaymentConfig && (this.product && config.expressPaymentConfig.paypalExpressEnabledOnProduct || config.expressPaymentConfig.paypalExpressEnabledOnCart)) {

        const mappingFunction = (cart: Cart, deliveryModes: DeliveryMode[], component: any, selectedShipingOption: any = null): Observable<PaypalUpdateOrderResponse> => {
          if (cart.totalPriceWithTax?.currencyIso && cart.totalPriceWithTax?.value) {

            let request = {
              amount: AmountUtil.createAmount(cart.totalPriceWithTax?.value, cart.totalPriceWithTax?.currencyIso),
              deliveryMethods: deliveryModes.map((deliveryMode, index) => {
                const deliveryCost = deliveryMode.deliveryCost?.value;
                const deliveryCurrency = deliveryMode.deliveryCost?.currencyIso
                if (deliveryCurrency === undefined || deliveryCost === undefined || deliveryCost === null || isNaN(Number(deliveryCost))) {
                  console.warn(`Invalid delivery cost for mode: ${deliveryMode.code}`);
                  throw "Invalid delivery cost"
                }

                return {
                  amount: AmountUtil.createAmount(deliveryCost, deliveryCurrency),
                  description: deliveryMode.name || '',
                  reference: deliveryMode.code || '',
                  selected: (selectedShipingOption === null && index === 0) || (selectedShipingOption !== null && deliveryMode.code === selectedShipingOption),
                };
              }),
              paymentData: component.paymentData,
              pspReference: this.pspReference,
            }
            return this.paypalExpressService.updatePaypalOrder(request);
          } else {
            console.error("cartId is undefined");
            throw "cartId is undefined"
          }
        }
        this.paypal = new PayPal(adyenCheckout, {

          amount: {
            currency: config.amount.currency,
            value: config.amount.value
          },
          isExpress: true,
          blockPayPalVenmoButton: true,
          blockPayPalCreditButton: true,
          blockPayPalPayLaterButton: true,

          intent: config.payPalIntent as Intent,

          onInit: (data: any, actions: any) => {
            this.initializeCart(this.product);
          },

          onShippingAddressChange: async (data, actions, component) => {
            const address = {
              postalCode: data.shippingAddress.postalCode,
              countryCode: data.shippingAddress.countryCode
            }
            let paypalUpdateOrderResponse = await this.handleShippingContactSelectedPayPal(address, this.product, mappingFunction, component, actions.reject);
            let paypalUpdateOrderResponseValue = await firstValueFrom(paypalUpdateOrderResponse);
            component.updatePaymentData(paypalUpdateOrderResponseValue.paymentData);

          },
          onShippingOptionsChange: async (data, actions, component) => {
            let paypalUpdateOrderResponse =
              await this.handleDeliveryModeSelectedPaypal<Observable<PaypalUpdateOrderResponse>>(data.selectedShippingOption.id, this.product,
               mappingFunction, component, actions.reject);
            let paypalUpdateOrderResponseValue = await firstValueFrom(paypalUpdateOrderResponse);
            component.updatePaymentData(paypalUpdateOrderResponseValue.paymentData);

          },
          onSubmit: (state: SubmitData, component: UIElement, actions: SubmitActions) => {
            this.handlePayPalSubmit(state, component, actions);
          },
          onAuthorized: (paymentData, actions) => {
            this.authorizedPaymentData = paymentData;
            this.handleAuthorise(paymentData, actions)
          },
          onAdditionalDetails: (additionalDetailsData, element, actions) => {
            this.handleAdditionalDetails(additionalDetailsData.data, actions)
          },
          onError: (error) => this.handleError(error)
        }).mount("#paypal-button");
      }
    }catch (error) {
      console.error('Failed to setup Adyen checkout:', error);
    }
  }

  protected async handleDeliveryModeSelectedPaypal<T>(deliveryModeId: string, product: Product,
                                                      mappingFunction: (cart: Cart, deliveryModes: DeliveryMode[], component: any, deliveryModeId: string) => T,
                                                      resolve: any, reject: any): Promise<T> {
    return new Promise(async (resolve, reject) => {
      if(!!this.cartId) {
        this.subscriptions.add(this.adyenCartService.setDeliveryMode(deliveryModeId, this.cartId)
          .pipe(
            switchMap(() => !!product ? this.adyenCartService.takeStable(this.cart$) : this.activeCartService.takeActive())
          ).subscribe({
            next: cart => {
              try {
                const update =  mappingFunction(cart, this.deliveryModes, this.paypal, deliveryModeId);
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
    })
  }

  protected async handleShippingContactSelectedPayPal(address: {
    postalCode: string,
    countryCode: string
  }, product: Product, mappingFunction: (cart: Cart, deliveryModes: DeliveryMode[], component: any) => Observable<PaypalUpdateOrderResponse>, component: any, reject: any): Promise<Observable<PaypalUpdateOrderResponse>> {
    const shippingAddress: Address = {
      postalCode: address.postalCode,
      country: {isocode: address.countryCode},
      firstName: "placeholder",
      lastName: "placeholder",
      town: "placeholder",
      line1: "placeholder"
    }
    return new Promise((resolve, reject) => {
      if(!!this.cartId) {
        const cartCode = this.cartId;
        this.subscriptions.add(this.adyenCartService.createAndSetAddress(cartCode, shippingAddress).subscribe(() => {
          this.subscriptions.add(this.getSupportedDeliveryModesState(cartCode).subscribe((deliveryModes) => {
            const validDeliveryModes = deliveryModes.filter(mode => mode.code);
            this.deliveryModes = validDeliveryModes;
            if (validDeliveryModes.length > 0) {
              this.subscriptions.add(this.adyenCartService
                .setDeliveryMode(validDeliveryModes[0].code!, cartCode)
                .pipe(
                  switchMap(() => !!product ? this.adyenCartService.takeStable(this.cart$) : this.activeCartService.takeActive())
                ).subscribe({
                  next: cart => {
                    let paypalUpdateOrderResponse = mappingFunction(cart, validDeliveryModes, component);
                    resolve(paypalUpdateOrderResponse);
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
    });
  }

  protected handlePayPalSubmit(state: SubmitData, component: UIElement, actions: SubmitActions) {
      if (!this.cartId) {
        console.error("cartId is undefined");
        actions.reject();
        return;
      }
      this.paypalExpressService.submitPayPal(state.data, this.product, this.cartId).subscribe({
        next: (paymentResponse) => {
          // @ts-ignore
          this.pspReference = paymentResponse?.pspReference;
          if (paymentResponse?.action) {
            component.handleAction(paymentResponse.action);
          }
        },
        error: (error) => {
          console.log(error);
          actions.reject();
        },
      });
  }

  protected handleAuthorise(state: any, actions: any) {
    if (this.cartId) {
      this.adyenOrderService.adyenPlacePayPalExpressOrder(state.data, this.authorizedPaymentData, this.product, this.cartId).subscribe(
        result => {
          if (result?.success) {
            if (result.executeAction && result.paymentsAction !== undefined) {
              this.paypal.handleAction(result.paymentsAction);
            } else {
              this.onSuccess();
            }
          } else {
            console.error(result?.error);
            actions.reject();
          }
          actions.resolve({resultCode: result.paymentsResponse?.resultCode});
        },
        error => {
          console.error(error);
          actions.reject();
        }
      );
    } else {
      console.error("cartId is undefined");
      actions.reject();
    }
  }

  protected handleAdditionalDetails(details: any, actions: AdditionalDetailsActions) {
    if (this.cartId) {
      this.adyenOrderService.sendAdditionalExpressDetails(details, this.cartId).subscribe(
        result => {
          this.handleResponse(result, actions);
        }
      );
    } else {
      console.error("cartId is undefined");
      actions.reject();
    }
  }

  protected handleResponse(response: PlaceOrderResponse | void, actions: SubmitActions) {
    if (!!response) {
      if (response.success) {
        if (response.executeAction === true && !!response.paymentsAction) {
          this.paypal.handleAction(response.paymentsAction)
        } else if (!!response.paymentsResponse) {
          actions.resolve({
            resultCode: response.paymentsResponse.resultCode
          });
          this.onSuccess();
        } else if (!!response.paymentDetailsResponse) {
          actions.resolve({
            resultCode: response.paymentDetailsResponse.resultCode
          });
          this.onSuccess();
        }
      }
    }
  }

  protected handleError(error: AdyenCheckoutError) {
  }

  protected onSuccess(): void {
    this.routingService.go({cxRoute: 'orderConfirmation'});
  }
}
