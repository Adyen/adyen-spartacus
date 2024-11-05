import { Component, OnInit,OnDestroy, Input } from '@angular/core';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { GooglePayButtonModule } from '@google-pay/button-angular';
import { ActionHandledReturnObject, CoreConfiguration, UIElement } from "@adyen/adyen-web";
import { AdyenCheckout, AdyenCheckoutError, GooglePay } from '@adyen/adyen-web/auto';
import { CheckoutAdyenConfigurationService } from "../../service/checkout-adyen-configuration.service";
import { AdyenConfigData } from "../../core/models/occ.config.models";
import { AdyenExpressOrderService } from "../../service/adyen-express-order.service";
import { RoutingService, Product,  EventService,  UserIdService, } from '@spartacus/core';
import { of } from 'rxjs';
import {BehaviorSubject, Subscription,} from 'rxjs';
import {ActiveCartFacade, CartType, MultiCartFacade} from '@spartacus/cart/base/root';
import {CheckoutAdyenConfigurationReloadEvent} from "../../events/checkout-adyen.events";

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

  googlePay: GooglePay;

  private authorizedPaymentData: any;

  constructor(
    protected checkoutAdyenConfigurationService: CheckoutAdyenConfigurationService,
    protected adyenOrderService: AdyenExpressOrderService,
    protected routingService: RoutingService,
    protected eventService: EventService,
    protected activeCartFacade: ActiveCartFacade,
    private userIdService: UserIdService,
  ) {}

  ngOnInit(): void {

    this.eventService.dispatch(
      new CheckoutAdyenConfigurationReloadEvent()
    );

    this.subscriptions.add(
      this.eventService.get(CheckoutAdyenConfigurationReloadEvent).subscribe(event => {
        this.handleConfigurationReload(event);
      })
    );

    this.initializeGooglePay();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if(this.googlePay) this.googlePay.unmount();
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
        totalPrice: this.product?.price?.value ? this.product.price.value.toString() : config.amountDecimal.toString(),
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
    this.adyenOrderService.adyenPlaceExpressOrder(state.data, this.authorizedPaymentData, this.product).subscribe(
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

  protected handleConfigurationReload(event: CheckoutAdyenConfigurationReloadEvent): void {
    this.googlePay.unmount();
    this.activeCartFacade.getActiveCartId().pipe(
      filter(cartId => !!cartId),
      switchMap(cartId => this.userIdService.takeUserId().pipe(
        switchMap(userId => this.checkoutAdyenConfigurationService.fetchCheckoutConfiguration(userId, cartId))
      ))
    ).subscribe(async config => {
      if (config) {
        await this.setupAdyenCheckout(config)
      }
    });
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

  handleError(error: AdyenCheckoutError) {}

  onSuccess(): void {
    this.routingService.go({ cxRoute: 'orderConfirmation' });
  }
}
