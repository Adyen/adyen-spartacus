import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ApplePay, SubmitData, UIElement} from "@adyen/adyen-web";
import {AdyenCheckout, AdyenCheckoutError} from '@adyen/adyen-web/auto';
import {AdyenExpressConfigData} from "../../core/models/occ.config.models";
import {AdyenExpressOrderService} from "../../service/adyen-express-order.service";
import {Address, Product, RoutingService, UserIdService,} from '@spartacus/core';
import {Subscription, switchMap} from 'rxjs';
import {ActiveCartFacade, MultiCartFacade} from '@spartacus/cart/base/root';
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
      onShippingContactSelected: (resolve, reject, event) => this.handleShippingContactSelected(resolve,reject,event, config.applePayMerchantName),
      onShippingMethodSelected: (resolve, reject, event) =>this.handleShippingMethodSelected(resolve,reject,event, config.applePayMerchantName),
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
  }

  async handleShippingContactSelected(resolve: any, reject: any, event: any, label: string): Promise<void> {
    await this.initializeCart(this.product);
    if (event.shippingContact) {
      const shippingAddress: Address = {
        postalCode: event.shippingContact.postalCode,
        country: {isocode: event.shippingContact.countryCode},
        firstName: "placeholder",
        lastName: "placeholder",
        town: "placeholder",
        line1: "placeholder"
      }
      this.subscriptions.add(this.adyenCartService.createAndSetAddress(this.cartId, shippingAddress).subscribe(() => {
        this.subscriptions.add(this.getSupportedDeliveryModesState(this.cartId).subscribe((deliveryModes) => {
          const validDeliveryModes = deliveryModes.filter(mode => mode.code);

          if (validDeliveryModes.length > 0) {
            this.subscriptions.add(this.adyenCartService
              .setDeliveryMode(validDeliveryModes[0].code!, this.cartId)
              .pipe(
                switchMap(() => !!this.product ? this.adyenCartService.takeStable(this.cart$) : this.activeCartService.takeActive())
              ).subscribe({
                next: cart => {
                  try {
                    const shippingContactUpdate = {
                      newTotal: {
                        label: label,
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

                    resolve(shippingContactUpdate);
                  } catch (e) {
                    console.error("Delivery mode mapping issue")
                    reject();
                  }
                },
                error: err => {
                  console.error('Error updating delivery mode:', err);
                  reject()
                },
              }));
          }
        }))
      }))

    }
  }

  handleShippingMethodSelected(resolve: any, reject: any, event: any, label: string): void {
    this.subscriptions.add(this.adyenCartService.setDeliveryMode(event.shippingMethod.identifier, this.cartId)
      .pipe(
        switchMap(() => !!this.product ? this.adyenCartService.takeStable(this.cart$) : this.activeCartService.takeActive())
      ).subscribe({
        next: cart => {
          try {
            const shippingMethodUpdate = {
              newTotal: {
                label: label,
                type: 'final',
                amount: cart.totalPriceWithTax!.value!.toString()
              }
            }
            resolve(shippingMethodUpdate)
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
