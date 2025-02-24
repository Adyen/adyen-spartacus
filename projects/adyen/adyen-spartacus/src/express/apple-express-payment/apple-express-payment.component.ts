import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ApplePay, SubmitData, UIElement} from "@adyen/adyen-web";
import {AdyenCheckout, AdyenCheckoutError} from '@adyen/adyen-web/auto';
import {AdyenExpressConfigData} from "../../core/models/occ.config.models";
import {AdyenExpressOrderService} from "../../service/adyen-express-order.service";
import {Product, RoutingService, UserIdService,} from '@spartacus/core';
import {ActiveCartFacade, Cart, DeliveryMode, MultiCartFacade} from '@spartacus/cart/base/root';
import {getAdyenExpressCheckoutConfig} from "../adyenCheckoutConfig.util";
import {ExpressPaymentBase} from "../base/express-payment-base";
import {AdyenCartService} from "../../service/adyen-cart-service";

@Component({
  selector: 'cx-apple-express-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './apple-express-payment.component.html',
  styleUrls: ['./apple-express-payment.component.css']
})
export class AppleExpressPaymentComponent extends ExpressPaymentBase implements OnInit, OnDestroy {

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
    protected override multiCartService: MultiCartFacade,
    protected override userIdService: UserIdService,
    protected override adyenCartService: AdyenCartService,
  ) {
    super(multiCartService, userIdService, activeCartFacade, adyenCartService)
  }

  ngOnInit(): void {
    this.setupAdyenCheckout(this.configuration)
  }


  private async setupAdyenCheckout(config: AdyenExpressConfigData) {
    const adyenCheckout = await AdyenCheckout(getAdyenExpressCheckoutConfig(config));

    this.applePay = new ApplePay(adyenCheckout, {
      amount: {
        currency: config.amount.currency,
        value: config.amount.value
      },
      configuration: {
        merchantId: config.applePayMerchantId,
        merchantName: config.applePayMerchantName
      },
      isExpress: true,
      // Button config
      buttonType: "check-out",
      buttonColor: "black",
      requiredShippingContactFields: [
        "postalAddress",
        "name",
        "email"
      ],
      onShippingContactSelected: (resolve, reject, event) => {
        const mappingFunction = (cart: Cart, deliveryModes: DeliveryMode[]): any => {
          return {
            newTotal: {
              label: config.applePayMerchantName,
              type: 'final',
              amount: cart.totalPriceWithTax!.value!.toString()
            },
            newShippingMethods: deliveryModes.map((mode) => ({
              identifier: mode.code!,
              label: mode.name || "",
              detail: mode.description || "",
              amount: mode.deliveryCost!.value!.toString()
            }))
          }
        }
        if (event.shippingContact) {
          const address = {postalCode: event.shippingContact.postalCode!, countryCode: event.shippingContact.countryCode!}
          this.handleShippingContactSelected<any>(address, this.product, mappingFunction, resolve, reject)
        }
      },
      onShippingMethodSelected: (resolve, reject, event) => {
        const mappingFunction = (cart: Cart): any => {
          return {
            newTotal: {
              label: config.applePayMerchantName,
              type: 'final',
              amount: cart.totalPriceWithTax!.value!.toString()
            }
          }
        }
        this.setDeliveryMode<any>(event.shippingMethod.identifier, this.product, mappingFunction, resolve, reject);
      },
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
    if(!!this.cartId){
      this.adyenOrderService.adyenPlaceAppleExpressOrder(state.data, this.authorizedPaymentData, this.product, this.cartId).subscribe(
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

  handleError(error: AdyenCheckoutError) {
  }

  onSuccess(): void {
    this.routingService.go({cxRoute: 'orderConfirmation'});
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy()
    this.subscriptions.unsubscribe();
    if (this.applePay) this.applePay.unmount();
  }
}
