import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild,} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ActiveCartFacade, CartType, MultiCartFacade} from '@spartacus/cart/base/root';
import {CheckoutDeliveryAddressFacade,} from '@spartacus/checkout/base/root';
import {
  Address,
  EventService,
  getLastValueSync,
  OCC_CART_ID_CURRENT,
  PaymentDetails,
  RoutingService,
  UserIdService,
  UserPaymentService,
} from '@spartacus/core';
import {BehaviorSubject, Subscription,} from 'rxjs';
import {filter, map, switchMap, take,} from 'rxjs/operators';
import {CheckoutStepService} from "@spartacus/checkout/base/components";
import {CheckoutAdyenConfigurationService} from "../service/checkout-adyen-configuration.service";
import {AdyenConfigData} from "../core/models/occ.config.models";
import {
  ActionHandledReturnObject,
  AdditionalDetailsActions,
  CoreConfiguration,
  DropinConfiguration,
  CardConfiguration,
  SubmitActions,
  UIElement
} from "@adyen/adyen-web";
import {BillingAddress, PlaceOrderResponse} from "../core/models/occ.order.models";
import {CheckoutAdyenConfigurationReloadEvent} from "../events/checkout-adyen.events";
import {AdyenCheckout, AdyenCheckoutError, Dropin} from '@adyen/adyen-web/auto'
import {AdyenExpressOrderService} from "../service/adyen-express-order.service";

@Component({
  selector: 'cx-payment-method',
  templateUrl: './checkout-adyen-payment-method.component.html',
  styleUrls: ['./checkout-adyen-payment-method.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutAdyenPaymentMethodComponent implements OnInit, OnDestroy {
  protected subscriptions = new Subscription();
  protected deliveryAddress: Address | undefined;
  protected busy$ = new BehaviorSubject<boolean>(false);

  //Adyen properties
  @ViewChild('hook', {static: true}) hook: ElementRef;
  sessionId: string = '';
  redirectResult: string = '';
  dropIn: Dropin;

  isGuestCheckout = false;
  paymentDetails?: PaymentDetails;
  billingAddress?: BillingAddress = undefined;


  get backBtnText() {
    return this.checkoutStepService.getBackBntText(this.activatedRoute);
  }


  constructor(
    protected userPaymentService: UserPaymentService,
    protected checkoutDeliveryAddressFacade: CheckoutDeliveryAddressFacade,
    protected activatedRoute: ActivatedRoute,
    protected routingService: RoutingService,
    protected activeCartFacade: ActiveCartFacade,
    protected checkoutStepService: CheckoutStepService,
    protected checkoutAdyenConfigurationService: CheckoutAdyenConfigurationService,
    protected adyenOrderService: AdyenExpressOrderService,
    protected eventService: EventService,
    private userIdService: UserIdService,
    protected multiCartFacade: MultiCartFacade,
  ) {
  }

  ngOnInit(): void {
    this.sessionId = this.activatedRoute.snapshot.queryParamMap.get('sessionId') || '';

    this.eventService.dispatch(
      new CheckoutAdyenConfigurationReloadEvent()
    );

    if (!getLastValueSync(this.activeCartFacade.isGuestCart())) {
      this.userPaymentService.loadPaymentMethods();
    } else {
      this.isGuestCheckout = true;
    }

    this.checkoutDeliveryAddressFacade
      .getDeliveryAddressState()
      .pipe(
        filter((state) => !state.loading),
        take(1),
        map((state) => state.data)
      )
      .subscribe((address) => {
        this.deliveryAddress = address;
      });

    this.subscriptions.add(
      this.eventService.get(CheckoutAdyenConfigurationReloadEvent).subscribe(event => {
        this.handleConfigurationReload(event);
      })
    );

    this.checkoutAdyenConfigurationService.getCheckoutConfigurationState()
      .pipe(
        filter((state) => !state.loading),
        take(1),
        map((state) => state.data)
      ).subscribe((async config => {
        if (config) {
          const adyenCheckout = await AdyenCheckout(this.getAdyenCheckoutConfig(config));
          this.dropIn = new Dropin(adyenCheckout,  this.getDropinConfiguration(config)
          ).mount(this.hook.nativeElement);

        }
      })
    );

  }

  protected handleConfigurationReload(event: CheckoutAdyenConfigurationReloadEvent): void {
    this.dropIn.unmount();
    this.activeCartFacade.getActiveCartId().pipe(
      filter(cartId => !!cartId),
      switchMap(cartId => this.userIdService.takeUserId().pipe(
        switchMap(userId => this.checkoutAdyenConfigurationService.fetchCheckoutConfiguration(userId, cartId))
      ))
    ).subscribe(async config => {
      if (config) {
        const adyenCheckout = await AdyenCheckout(this.getAdyenCheckoutConfig(config));
        this.dropIn = new Dropin(adyenCheckout, this.getDropinConfiguration(config)
        ).mount(this.hook.nativeElement);
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
      countryCode: adyenConfig.countryCode,
      environment: this.castToEnvironment(adyenConfig.environmentMode),
      clientKey: adyenConfig.adyenClientKey,
      amount: adyenConfig.amount,
      analytics: {
        enabled: false
      },
      //@ts-ignore
      risk: {
        enabled: true
      },
      onError: (error: AdyenCheckoutError) => this.handleError(error),
      onSubmit: (state: any, element: UIElement, actions: SubmitActions) => this.handlePayment(state.data,actions),
      onAdditionalDetails: (state: any, element: UIElement, actions: AdditionalDetailsActions ) => this.handleAdditionalDetails(state.data,actions),
      onActionHandled(data: ActionHandledReturnObject) {
        console.log("onActionHandled", data);
      }
    }
  }

  protected castToEnvironment(env: string): CoreConfiguration['environment'] {
    const validEnvironments: CoreConfiguration['environment'][] = ['test', 'live', 'live-us', 'live-au', 'live-apse', 'live-in'];
    if (validEnvironments.includes(env as CoreConfiguration['environment'])) {
      return env as CoreConfiguration['environment'];
    }
    throw new Error(`Invalid environment: ${env}`);
  }

  private getDropinConfiguration(adyenConfig: AdyenConfigData): DropinConfiguration {
      const config: CardConfiguration ={
              type: 'card',
              hasHolderName: true,
              holderNameRequired: adyenConfig.cardHolderNameRequired,
              enableStoreDetails: adyenConfig.showRememberTheseDetails,
              clickToPayConfiguration: {
                  merchantDisplayName: adyenConfig.merchantDisplayName,
                  shopperEmail: adyenConfig.shopperEmail,
                  locale: adyenConfig.clickToPayLocale,
              },
          };

          if (adyenConfig.installmentOptions) {
              config.installmentOptions = adyenConfig.installmentOptions;
          }
          
          return config;
    }

  next(): void {
    this.checkoutStepService.next(this.activatedRoute);
  }

  back(): void {
    this.checkoutStepService.back(this.activatedRoute);
  }

  onSuccess(): void {
    console.log("Redirect to orderConfirmation..");
    this.routingService.go({cxRoute: 'orderConfirmation'});
  }

  protected onError(): void {
    this.busy$.next(false);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  setBillingAddress(address?: BillingAddress) {
    this.billingAddress = address;
  }

  private handlePayment(paymentData: any, actions: SubmitActions) {
    this.adyenOrderService.adyenPlaceOrder(paymentData, this.billingAddress).subscribe(
      result => {
        this.handleResponse(result, actions);
      }
    );
  }

  private handleAdditionalDetails(details: any, actions: AdditionalDetailsActions) {
    this.adyenOrderService.sendAdditionalDetails(details).subscribe(
      result => {
        this.handleResponse(result, actions);
      }
    );
  }

  private handleResponse(response: PlaceOrderResponse | void, actions: SubmitActions) {
    if (!!response) {
      if (response.success) {
        if (response.executeAction === true && !!response.paymentsAction) {
          this.dropIn.handleAction(response.paymentsAction)
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
      } else {
        this.resetDropInComponent()
      }
    }
  }

  private handleError(error: AdyenCheckoutError) {
    let subscribeCancel = this.adyenOrderService.sendPaymentCancelled().subscribe(() => {
      this.multiCartFacade.reloadCart(OCC_CART_ID_CURRENT)

      let subscribeUser = this.userIdService.takeUserId().subscribe((userId) => {
        this.multiCartFacade.loadCart({cartId: OCC_CART_ID_CURRENT, userId})

        let subscribeCart = this.multiCartFacade.getCartIdByType(CartType.ACTIVE).subscribe((cartId) => {
          this.eventService.dispatch(
            new CheckoutAdyenConfigurationReloadEvent()
          );
        });
        subscribeCart.unsubscribe();
      });
      subscribeUser.unsubscribe();
      subscribeCancel.unsubscribe();
    });
  }

  private resetDropInComponent() {
    this.dropIn.unmount();
    this.dropIn.mount(this.hook.nativeElement)
  }

}
