import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GooglePayButtonModule} from '@google-pay/button-angular';
import {UIElement} from "@adyen/adyen-web";
import {AdyenCheckout, AdyenCheckoutError, GooglePay} from '@adyen/adyen-web/auto';
import {AdyenExpressConfigData} from "../../core/models/occ.config.models";
import {AdyenExpressOrderService} from "../../service/adyen-express-order.service";
import {EventService, Product, RoutingService, UserIdService} from '@spartacus/core';
import {ActiveCartFacade, Cart, DeliveryMode, MultiCartFacade} from '@spartacus/cart/base/root';
import {getAdyenExpressCheckoutConfig} from "../adyenCheckoutConfig.util";
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
    protected override eventService: EventService
  ) {
    super(multiCartService, userIdService, activeCartService, adyenCartService, eventService)
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
          countryCode: undefined,
        },
        onSubmit: (state: any, element: UIElement, actions) => this.handleOnSubmit(state, actions),
        paymentDataCallbacks: {
          onPaymentDataChanged: async (intermediatePaymentData) => {
            return new Promise(async (resolve, reject) => {
              const {callbackTrigger, shippingAddress, shippingOptionData} = intermediatePaymentData;
              // const paymentDataRequestUpdate: google.payments.api.PaymentDataRequestUpdate = {};

              if (callbackTrigger === 'INITIALIZE') {
                await this.initializeCart(this.product);
              }

              if (callbackTrigger === 'INITIALIZE' || callbackTrigger === 'SHIPPING_ADDRESS') {
                if (shippingAddress) {
                  const mappingFunction = (cart: Cart, deliveryModes: DeliveryMode[]): google.payments.api.PaymentDataRequestUpdate => {
                    let shippingOptionsUpdate = this.updateShippingOptions(deliveryModes);
                    let cartUpdate = this.updateTransactionInfo(cart);

                    return {...shippingOptionsUpdate, ...cartUpdate}
                  }

                  const address = {
                    postalCode: shippingAddress.postalCode,
                    countryCode: shippingAddress.countryCode
                  }

                  await this.handleShippingContactSelected<google.payments.api.PaymentDataRequestUpdate>(address, this.product, mappingFunction, resolve, reject)
                }
              }

              if (callbackTrigger === 'SHIPPING_OPTION') {
                if (shippingOptionData) {
                  this.setDeliveryMode<google.payments.api.PaymentDataRequestUpdate>(shippingOptionData.id, this.product, (cart: Cart) => ({
                    newTransactionInfo: this.updateTransactionInfo(cart)
                  }), resolve, reject);
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

  private updateShippingOptions(deliveryModes: DeliveryMode[]): google.payments.api.PaymentDataRequestUpdate {
    return {
      newShippingOptionParameters: {
        defaultSelectedOptionId: deliveryModes[0].code,
        shippingOptions: deliveryModes.map(mode => ({
          id: mode.code!,
          label: mode.name || "",
          description: mode.description || ""
        }))
      }
    }
  }

  private updateTransactionInfo(cart: Cart): google.payments.api.TransactionInfo {
    if (
      !cart.totalPriceWithTax?.currencyIso ||
      !cart.totalPriceWithTax?.value
    ) {
      throw new Error("Missing required values.");
    }

    return {
      countryCode: undefined,
      currencyCode: cart.totalPriceWithTax.currencyIso,
      totalPriceStatus: 'FINAL',
      totalPrice: cart.totalPriceWithTax.value.toString(),
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
              actions.resolve({ resultCode: 'Authorised' });
              this.onSuccess();
            }
          } else {
            console.error(result?.error);
            actions.reject();
          }
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
