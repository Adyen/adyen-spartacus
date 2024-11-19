import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {CommonModule} from '@angular/common';
import { ApplePay, CoreConfiguration, SubmitData, UIElement} from "@adyen/adyen-web";
import {AdyenCheckout, AdyenCheckoutError} from '@adyen/adyen-web/auto';
import {CheckoutAdyenConfigurationService} from "../../service/checkout-adyen-configuration.service";
import {AdyenConfigData} from "../../core/models/occ.config.models";
import {AdyenExpressOrderService} from "../../service/adyen-express-order.service";
import {EventService, Product, RoutingService, UserIdService,} from '@spartacus/core';
import {of, Subscription} from 'rxjs';
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {CheckoutAdyenConfigurationReloadEvent} from "../../events/checkout-adyen.events";

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

  applePay: ApplePay;

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

    this.initializeApplePay();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if(this.applePay) this.applePay.unmount();
  }

  private initializeApplePay() {
    this.checkoutAdyenConfigurationService.getCheckoutConfigurationState()
      .pipe(
        filter((state) => !state.loading),
        take(1),
        map((state) => state.data),
        switchMap((config) => config ? this.setupAdyenCheckout(config) : of(null))
      )
      .subscribe({
        error: (error) => console.error('Error initializing Apple Pay:', error)
      });
  }

  private async setupAdyenCheckout(config: AdyenConfigData) {
    const adyenCheckout = await AdyenCheckout(this.getAdyenCheckoutConfig(config));

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

  protected handleConfigurationReload(event: CheckoutAdyenConfigurationReloadEvent): void {
    this.applePay.unmount();
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
