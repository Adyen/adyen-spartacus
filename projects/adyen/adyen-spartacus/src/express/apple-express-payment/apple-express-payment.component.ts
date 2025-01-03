import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ApplePay, SubmitData, UIElement} from "@adyen/adyen-web";
import {AdyenCheckout, AdyenCheckoutError} from '@adyen/adyen-web/auto';
import {AdyenExpressConfigData} from "../../core/models/occ.config.models";
import {AdyenExpressOrderService} from "../../service/adyen-express-order.service";
import {Product, RoutingService,} from '@spartacus/core';
import {Subscription} from 'rxjs';
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {getAdyenExpressCheckoutConfig} from "../adyenCheckoutConfig.util";

@Component({
  selector: 'cx-apple-express-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './apple-express-payment.component.html',
  styleUrls: ['./apple-express-payment.component.css']
})
export class AppleExpressPaymentComponent implements OnInit, OnDestroy{

  protected subscriptions = new Subscription();

  @Input()
  product: Product;

  @Input()
  configuration: AdyenExpressConfigData;

  applePay: ApplePay;

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
    if(this.applePay) this.applePay.unmount();
  }

  private async setupAdyenCheckout(config: AdyenExpressConfigData) {
    const adyenCheckout = await AdyenCheckout(getAdyenExpressCheckoutConfig(config));

    this.applePay = new ApplePay(adyenCheckout, {
      amount: {
        currency: config.amount.currency,
        value: config.amount.value
      },
      // Button config
      buttonType: "check-out",
      buttonColor: "black",
      requiredShippingContactFields: [
        "postalAddress",
        "name",
        "email"
      ],
      onSubmit: (state, element: UIElement, actions) => this.handleOnSubmit(state, actions),
      onAuthorized: (paymentData, actions) => {
        this.authorizedPaymentData = paymentData;
        actions.resolve();
      },
      onError: (error) => this.handleError(error)
    })

    this.applePay.isAvailable()
      .then(() => this.applePay.mount("#apple-pay-button"))
  }

  private handleOnSubmit(state: SubmitData, actions: any) {
    this.adyenOrderService.adyenPlaceAppleExpressOrder(state.data, this.authorizedPaymentData, this.product).subscribe(
      result => {
        if (result?.success) {
          if (result.executeAction && result.paymentsAction !== undefined) {
            this.applePay.handleAction(result.paymentsAction);
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
