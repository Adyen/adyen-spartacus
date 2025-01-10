import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GooglePayButtonModule} from '@google-pay/button-angular';
import {UIElement} from "@adyen/adyen-web";
import {AdyenCheckout, AdyenCheckoutError, GooglePay} from '@adyen/adyen-web/auto';
import {AdyenExpressConfigData} from "../../core/models/occ.config.models";
import {AdyenExpressOrderService} from "../../service/adyen-express-order.service";
import {Product, RoutingService,} from '@spartacus/core';
import {Subscription} from 'rxjs';
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {getAdyenExpressCheckoutConfig} from "../adyenCheckoutConfig.util";

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
    protected activeCartFacade: ActiveCartFacade,
  ) {}

  ngOnInit(): void {
    this.setupAdyenCheckout(this.configuration)
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.googlePay) {
      this.googlePay.unmount();
    }
  }

  private async setupAdyenCheckout(config: AdyenExpressConfigData) {
    const adyenCheckout = await AdyenCheckout(getAdyenExpressCheckoutConfig(config));

    if (this.googlePay) {
      this.googlePay.unmount();
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
          totalPrice: config.amountDecimal.toString(),
          currencyCode: config.amount.currency,
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
