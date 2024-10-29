import { Component, OnInit, Input } from '@angular/core';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { GooglePayButtonModule } from '@google-pay/button-angular';
import { ActionHandledReturnObject, CoreConfiguration, UIElement } from "@adyen/adyen-web";
import { AdyenCheckout, AdyenCheckoutError, GooglePay } from '@adyen/adyen-web/auto';
import { CheckoutAdyenConfigurationService } from "../../service/checkout-adyen-configuration.service";
import { AdyenConfigData } from "../../core/models/occ.config.models";
import { AdyenExpressOrderService } from "../../service/adyen-express-order.service";
import { RoutingService, Product } from '@spartacus/core';
import { of } from 'rxjs';

@Component({
  selector: 'cx-google-express-payment',
  standalone: true,
  imports: [CommonModule, GooglePayButtonModule],
  templateUrl: './google-express-payment.component.html',
  styleUrls: ['./google-express-payment.component.css']
})
export class GoogleExpressPaymentComponent implements OnInit {

  @Input()
  product: Product;

  googlePay: GooglePay;

  private authorizedPaymentData: any;

  constructor(
    protected checkoutAdyenConfigurationService: CheckoutAdyenConfigurationService,
    protected adyenOrderService: AdyenExpressOrderService,
    protected routingService: RoutingService,
  ) {}

  ngOnInit(): void {
    this.initializeGooglePay();
  }

  private initializeGooglePay() {
    this.checkoutAdyenConfigurationService.getCheckoutConfigurationState()
      .pipe(
        filter((state) => !state.loading),
        take(1),
        map((state) => state.data),
        switchMap((config) => config ? this.setupAdyenCheckout(config) : of(null))
      )
      .subscribe({
        error: (error) => console.error('Error initializing Google Pay:', error)
      });
  }

  private async setupAdyenCheckout(config: AdyenConfigData) {
    const adyenCheckout = await AdyenCheckout(this.getAdyenCheckoutConfig(config));

    if (this.product) {
      console.log("Product: ", this.product.purchasable);
      console.log("Product: ", this.product.code);
    }

    this.googlePay = new GooglePay(adyenCheckout, {
      callbackIntents: ['SHIPPING_ADDRESS'],
      shippingAddressRequired: true,
      shippingOptionRequired: false,
      emailRequired: true,
      shippingAddressParameters: {
        allowedCountryCodes: [],
        phoneNumberRequired: false
      },
      isExpress: true,
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPriceLabel: 'Total',
        totalPrice: this.product?.price?.value ? this.product.price.value.toString() : this.convertAmount(config.amount.value),
        currencyCode: this.product?.price?.currencyIso ? this.product.price.currencyIso : config.amount.currency,
        countryCode: 'US'
      },
      onSubmit: (state: any, element: UIElement, actions) => this.handleOnSubmit(state, actions),
      paymentDataCallbacks: {
        onPaymentDataChanged: async (intermediatePaymentData) => {
          return new Promise(async resolve => {
            const paymentDataRequestUpdate: google.payments.api.PaymentDataRequestUpdate = {};
            resolve(paymentDataRequestUpdate);
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

  private handleOnSubmit(state: any, actions: any) {
    this.adyenOrderService.adyenPlaceOrder(state.data, this.authorizedPaymentData, this.product).subscribe(
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

  convertAmount(num: number): string {
    const integerPart = Math.floor(num / 100).toString();
    const decimalPart = (num % 100).toString().padStart(2, '0');
    return `${integerPart}.${decimalPart}`;
  }

  protected getAdyenCheckoutConfig(adyenConfig: AdyenConfigData): CoreConfiguration {
    return {
      paymentMethodsResponse: {
        paymentMethods: adyenConfig.paymentMethods,
        storedPaymentMethods: adyenConfig.storedPaymentMethodList
      },
      locale: adyenConfig.shopperLocale,
      environment: this.castToEnvironment(adyenConfig.environmentMode),
      clientKey: adyenConfig.adyenClientKey,
      session: {
        id: adyenConfig.sessionData.id,
        sessionData: adyenConfig.sessionData.sessionData
      },
      countryCode: adyenConfig.countryCode ? adyenConfig.countryCode : 'US',
      analytics: {
        enabled: false
      },
      //@ts-ignore
      risk: {
        enabled: true
      }
    };
  }

  protected castToEnvironment(env: string): CoreConfiguration['environment'] {
    const validEnvironments: CoreConfiguration['environment'][] = ['test', 'live', 'live-us', 'live-au', 'live-apse', 'live-in'];
    if (validEnvironments.includes(env as CoreConfiguration['environment'])) {
      return env as CoreConfiguration['environment'];
    }
    throw new Error(`Invalid environment: ${env}`);
  }

  handleError(error: AdyenCheckoutError) {
    console.error("Something went wrong", error);
  }

  onSuccess(): void {
    console.log("Redirect to orderConfirmation..");
    this.routingService.go({ cxRoute: 'orderConfirmation' });
  }
}
