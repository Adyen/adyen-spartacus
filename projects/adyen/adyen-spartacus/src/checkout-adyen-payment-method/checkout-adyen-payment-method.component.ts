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
import {ActionHandledReturnObject} from "@adyen/adyen-web";
import {PlaceOrderResponse} from "../core/models/occ.order.models";
import {AdyenOrderService} from "../service/adyen-order.service";
import {CheckoutAdyenConfigurationReloadEvent} from "../events/checkout-adyen.events";
import {CoreConfiguration, DropinConfiguration, UIElement} from "@adyen/adyen-web";
import { AdyenCheckout, Dropin,AdyenCheckoutError } from '@adyen/adyen-web/auto'

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
  billingAddress?: Address = undefined;


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
    protected adyenOrderService: AdyenOrderService,
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
      environment: this.castToEnvironment(adyenConfig.environmentMode),
      clientKey: adyenConfig.adyenClientKey,
      session: {
        id: adyenConfig.sessionData.id,
        sessionData: adyenConfig.sessionData.sessionData
      },
      analytics: {
        enabled: false
      },
      //@ts-ignore
      risk: {
        enabled: true
      },
      onError: (error: AdyenCheckoutError) => this.handleError(error),
      onSubmit: (state: any, element: UIElement) => this.handlePayment(state.data),
      onAdditionalDetails: (state: any, element?: UIElement) => this.handleAdditionalDetails(state.data),
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
    return {
      paymentMethodsConfiguration: {
        card: {
          type: 'card',
          hasHolderName: true,
          holderNameRequired: adyenConfig.cardHolderNameRequired,
          enableStoreDetails: adyenConfig.showRememberTheseDetails
        },
        paypal: {
          intent: "authorize"
        }
      },
    }
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

  setBillingAddress(address?: Address) {
    this.billingAddress = address;
  }

  private handlePayment(paymentData: any) {
    this.adyenOrderService.adyenPlaceOrder(paymentData, this.billingAddress).subscribe(
      result => {
        this.handleResponse(result);
      }
    );
  }

  private handleAdditionalDetails(details: any) {
    this.adyenOrderService.sendAdditionalDetails(details).subscribe(
      result => {
        this.handleResponse(result);
      }
    );
  }

  private handleResponse(response: PlaceOrderResponse | void) {
    if (!!response) {
      if (response.success) {
        if (response.executeAction && response.paymentsAction !== undefined) {
          this.dropIn.handleAction(response.paymentsAction)
        } else {
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
