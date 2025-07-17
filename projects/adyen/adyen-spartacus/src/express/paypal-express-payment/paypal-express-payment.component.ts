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
    protected activeCartFacade: ActiveCartFacade,
    protected paypalExpressService: PaypalExpressService,
    protected override routingService: RoutingService,
    protected override activeCartService: ActiveCartFacade,
    protected override multiCartService: MultiCartFacade,
    protected override userIdService: UserIdService,
    protected override adyenCartService: AdyenCartService,
    protected override eventService: EventService
  ) {
    super(multiCartService, userIdService, activeCartService, adyenCartService, eventService, routingService)
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

        const mappingFunction = (cart: Cart, deliveryModes: DeliveryMode[], component: any, selectedShippingOption: any = null): Observable<PaypalUpdateOrderResponse> => {
          if (!!cart.code && cart.totalPriceWithTax?.currencyIso && cart.totalPriceWithTax?.value) {

            let request = {
              amount: {value: -1, currency: cart.totalPriceWithTax?.currencyIso},
              deliveryMethods: deliveryModes
                .filter((deliveryMode) => selectedShippingOption === null || deliveryMode.code === selectedShippingOption)
                .map((deliveryMode) => {
                  const deliveryCurrency = deliveryMode.deliveryCost?.currencyIso;
                  if (deliveryCurrency === undefined) {
                    console.warn(`Invalid delivery cost for mode: ${deliveryMode.code}`);
                    throw "Invalid delivery cost";
                  }

                  return {
                    amount: {value: -1, currency: deliveryCurrency},
                    description: deliveryMode.name || '',
                    reference: deliveryMode.code || '',
                    selected: true,
                  };
                }),
              paymentData: component.paymentData,
              pspReference: this.pspReference,
            }
            return this.paypalExpressService.updatePaypalOrder(cart.code, request);
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
          style: {
            // @ts-ignore
            borderRadius: 32,
            height: 48,
            disableMaxWidth: true,
          },
          isExpress: true,
          blockPayPalVenmoButton: true,
          blockPayPalCreditButton: true,
          blockPayPalPayLaterButton: true,

          intent: config.payPalIntent as Intent,

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
          onSubmit: async (state: SubmitData, component: UIElement, actions: SubmitActions) => {
            await this.initializeCart(this.product);
            await this.handlePayPalSubmit(state, component, actions);
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
      if(!!PaypalExpressPaymentComponent.cartId) {
        this.subscriptions.add(this.adyenCartService.setDeliveryMode(deliveryModeId, PaypalExpressPaymentComponent.cartId)
          .pipe(
            switchMap(() => !!product ? this.adyenCartService.takeStable(PaypalExpressPaymentComponent.cart$) : this.activeCartService.takeActive())
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
      if(!!PaypalExpressPaymentComponent.cartId) {
        const cartCode = PaypalExpressPaymentComponent.cartId;
        this.subscriptions.add(this.adyenCartService.createAndSetAddress(cartCode, shippingAddress).subscribe(() => {
          this.subscriptions.add(this.adyenCartService.getSupportedDeliveryModesForCart(cartCode).subscribe((deliveryModes) => {
            const validDeliveryModes = deliveryModes.filter(mode => mode.code);
            this.deliveryModes = validDeliveryModes;
            if (validDeliveryModes.length > 0) {
              this.subscriptions.add(this.adyenCartService
                .setDeliveryMode(validDeliveryModes[0].code!, cartCode)
                .pipe(
                  switchMap(() => !!product ? this.adyenCartService.takeStable(PaypalExpressPaymentComponent.cart$) : this.activeCartService.takeActive())
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

  protected async handlePayPalSubmit(state: SubmitData, component: UIElement, actions: SubmitActions) {
    if (!PaypalExpressPaymentComponent.cartId) {
      console.error("cartId is undefined");
      actions.reject();
      return;
    }

    let paymentResponse = this.paypalExpressService.submitPayPal(state.data, this.product, PaypalExpressPaymentComponent.cartId);
    let paymentResponseValue = await firstValueFrom(paymentResponse);

    // @ts-ignore
    this.pspReference = paymentResponseValue?.pspReference;
    if (paymentResponseValue?.action) {
      component.handleAction(paymentResponseValue.action);
    }

  }

  protected handleAuthorise(state: any, actions: any) {
    if (PaypalExpressPaymentComponent.cartId) {
      this.adyenOrderService.adyenPlacePayPalExpressOrder(state.data, this.authorizedPaymentData, this.product, PaypalExpressPaymentComponent.cartId).subscribe(
        result => {
          if (result?.success) {
            if (result.executeAction && result.paymentsAction !== undefined) {
              this.paypal.handleAction(result.paymentsAction);
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
    if (PaypalExpressPaymentComponent.cartId) {
      this.adyenOrderService.sendAdditionalExpressDetails(details, PaypalExpressPaymentComponent.cartId).subscribe(
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
    this.clearStaticState();
  }

}
