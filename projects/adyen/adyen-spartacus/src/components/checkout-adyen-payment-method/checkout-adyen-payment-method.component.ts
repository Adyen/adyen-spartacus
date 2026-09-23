import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild,} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ActiveCartFacade, MultiCartFacade} from '@spartacus/cart/base/root';
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
import {
  BehaviorSubject,
  combineLatest,
  Subscription
} from 'rxjs';
import {filter, map, switchMap, take,} from 'rxjs/operators';
import { CheckoutStepService } from "@spartacus/checkout/base/components";
import {CheckoutAdyenConfigurationService} from "../../core/services/checkout-adyen-configuration.service";
import {AdyenConfigData} from "../../core/models/occ.config.models";
import {
  ActionHandledReturnObject,
  AdditionalDetailsActions,
  CoreConfiguration,
  DropinConfiguration,
  EcontextConfiguration,
  EcontextInputSchema,
  SubmitActions,
  UIElement
} from '@adyen/adyen-web';
import {BillingAddress, PlaceOrderResponse, PaymentState} from "../../core/models/occ.order.models";
import {CheckoutAdyenConfigurationReloadEvent} from "../../core/events/checkout-adyen.events";
import {AdyenCheckout, AdyenCheckoutError, Dropin} from '@adyen/adyen-web/auto'
import {AdyenExpressOrderService} from "../../core/services/adyen-express-order.service";
import {AdyenPartialPaymentService} from "../../core/services/adyen-partial-payment.service";

@Component({
  selector: 'cx-payment-method',
  templateUrl: './checkout-adyen-payment-method.component.html',
  styleUrls: ['./checkout-adyen-payment-method.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class CheckoutAdyenPaymentMethodComponent implements OnInit, OnDestroy {
  protected subscriptions = new Subscription();
  protected deliveryAddress: Address | undefined;
  protected shopperEmail: string | undefined;
  protected busy$ = new BehaviorSubject<boolean>(false);

  //Adyen properties
  @ViewChild('hook', {static: true}) hook: ElementRef;
  sessionId: string = '';
  redirectResult: string = '';
  dropIn: Dropin;

  isGuestCheckout = false;
  paymentDetails?: PaymentDetails;
  billingAddress?: BillingAddress = undefined;

  // Partial payment state
  paymentState: PaymentState = {
    errorCode: '',
    errorFieldCodes: [],
    orderNumber: '',
    partialPaymentId: undefined,
    redirectToNextStep: false
  };

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
    protected partialPaymentService: AdyenPartialPaymentService,
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

    const deliveryAddress$ = this.checkoutDeliveryAddressFacade
      .getDeliveryAddressState()
      .pipe(
        filter(state => !state.loading),
        map(state => state.data)
      );

    const checkoutConfiguration$ =
      this.checkoutAdyenConfigurationService
        .getCheckoutConfigurationState()
        .pipe(
          filter(state => !state.loading),
          map(state => state.data),
          filter(
            (config): config is AdyenConfigData => !!config
          )
        );

    this.subscriptions.add(
      combineLatest([
        deliveryAddress$,
        checkoutConfiguration$
      ])
        .pipe(take(1))
        .subscribe(async ([address, config]) => {
          this.deliveryAddress = address;
          this.shopperEmail = config.shopperEmail;

          const adyenCheckout = await AdyenCheckout(
            this.getAdyenCheckoutConfig(config)
          );

          this.dropIn = new Dropin(
            adyenCheckout,
            this.getDropinConfiguration(config)
          ).mount(this.hook.nativeElement);
        })
    );

    this.checkoutDeliveryAddressFacade
      .getDeliveryAddressState()
      .pipe(
        filter((state: any) => !state.loading),
        take(1),
        map((state: any) => state.data)
      )
      .subscribe((address: Address | undefined) => {
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
          this.shopperEmail = config.shopperEmail;
          const adyenCheckout = await AdyenCheckout(this.getAdyenCheckoutConfig(config));
          this.dropIn = new Dropin(adyenCheckout,  this.getDropinConfiguration(config)
          ).mount(this.hook.nativeElement);

        }
      })
    );

    // Subscribe to partial payment state changes
    this.subscriptions.add(
      this.partialPaymentService.getPaymentState().subscribe(state => {
        this.paymentState = state;

        if (state.redirectToNextStep) {
          this.onSuccess();
        }
      })
    );
  }

  protected handleConfigurationReload(event: CheckoutAdyenConfigurationReloadEvent): void {
    this.dropIn.unmount();
    this.activeCartFacade.getActiveCartId().pipe(
      filter(cartId => !!cartId),
      switchMap(cartId => this.userIdService.takeUserId().pipe(
        switchMap(userId => this.checkoutAdyenConfigurationService.fetchCheckoutConfiguration(userId, cartId as string))
      ))
    ).subscribe(async (config: AdyenConfigData) => {
      if (config) {
        this.shopperEmail = config.shopperEmail;
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
      onBalanceCheck: async (resolve: any, reject: any, data: any) =>
        this.partialPaymentService.handleBalanceCheck(resolve, reject, {...data, amount: adyenConfig.amount}),
      onOrderRequest: async (resolve: any, reject: any, data: any) =>
        this.partialPaymentService.handleOrderRequest(resolve, reject, {...data, amount: adyenConfig.amount, shopperReference: adyenConfig.shopperReference}),
      onActionHandled(data: ActionHandledReturnObject) {
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
    const econtextConfiguration =
      this.getEcontextConfiguration(adyenConfig);
    return {
      paymentMethodsConfiguration: {
        card: {
          type: 'card',
          hasHolderName: true,
          holderNameRequired: adyenConfig.cardHolderNameRequired,
          enableStoreDetails: adyenConfig.showRememberTheseDetails,
          clickToPayConfiguration: {
            merchantDisplayName: adyenConfig.merchantDisplayName,
            shopperEmail:  adyenConfig.shopperEmail,
            locale: adyenConfig.clickToPayLocale,
          },
          installmentOptions: adyenConfig.installmentOptions ? adyenConfig.installmentOptions : {} ,
        },
        paypal: {
          intent: "authorize"
        },
        econtext: {
          ...econtextConfiguration
        },
        econtext_atm: {
          ...econtextConfiguration
        },
        econtext_online: {
          ...econtextConfiguration
        },
        econtext_seven_eleven: {
          ...econtextConfiguration
        },
        econtext_stores: {
          ...econtextConfiguration
        }
      },
      showPayButton: true,
      //@ts-ignore
      isPartialPayment: true,
      //@ts-ignore
      showRemainingAmount: true
    }
  }

  next(): void {
    this.checkoutStepService.next(this.activatedRoute);
  }

  back(): void {
    this.checkoutStepService.back(this.activatedRoute);
  }

  onSuccess(): void {
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
    const preparedPaymentData = this.preparePaymentData(paymentData);

    this.adyenOrderService.adyenPlaceOrder(preparedPaymentData, this.billingAddress, this.paymentState.partialPaymentId).subscribe(
      result => {
        this.handleResponse(result, actions);
      }
    );
  }

  private preparePaymentData(paymentData: any): any {
    const paymentMethodType = paymentData?.paymentMethod?.type;

    if (typeof paymentMethodType !== 'string' || !paymentMethodType.startsWith('econtext')) {
      return paymentData;
    }

    const shopperAddress = this.billingAddress ?? this.deliveryAddress;

    return {
      ...paymentData,
      shopperName: {
        firstName: paymentData.shopperName?.firstName || paymentData.firstName || shopperAddress?.firstName,
        lastName: paymentData.shopperName?.lastName || paymentData.lastName || shopperAddress?.lastName
      },
      shopperEmail: paymentData.shopperEmail || shopperAddress?.email || this.shopperEmail,
      telephoneNumber: paymentData.telephoneNumber || shopperAddress?.phone || shopperAddress?.cellphone
    };
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
          this.dropIn.handleAction(response.paymentsAction);

        } else if (!!response.paymentsResponse) {
          const remainingAmount = response.paymentsResponse.order?.remainingAmount;
          if (remainingAmount && remainingAmount.value > 0) {
            // Partial payment step — giftcard applied, remaining amount still due
            actions.resolve(response.paymentsResponse);
          } else {
            // Payment fully covered by paymentsResponse
            actions.resolve({
              resultCode: response.paymentsResponse.resultCode || 'Authorised'
            });
            if (response.orderNumber) {
              this.partialPaymentService.markPaymentCompleted();
              this.partialPaymentService.resetPaymentState();
              this.onSuccess();
            }
          }

        } else if (response.remainingAmount && response.remainingAmount.value > 0) {
          // Backend returned remainingAmount at top level instead of inside paymentsResponse
          actions.resolve({
            resultCode: 'Authorised',
            order: {
              remainingAmount: response.remainingAmount,
              pspReference: response.pspReference ?? '',
              orderData: ''
            }
          } as any);

        } else if (!!response.paymentDetailsResponse) {
          actions.resolve({
            resultCode: response.paymentDetailsResponse.resultCode
          });
          this.onSuccess();
        }
      } else {
        this.resetDropInComponent();
      }
    }
  }

  private handleError(error: AdyenCheckoutError) {
    // Adyen Drop-in surfaces errors (including failed partial-payment steps) via onError.
    // Recover without cascading: cancel any placed order on the backend (the service
    // no-ops when there is no order number, so we never POST payment-canceled/undefined),
    // refresh the cart, then remount the Drop-in so the shopper can retry. Tracked in
    // this.subscriptions to avoid the nested-subscribe leak/race this used to have.
    this.busy$.next(false);
    this.subscriptions.add(
      this.adyenOrderService.sendPaymentCancelled().pipe(
        switchMap(() => this.userIdService.takeUserId().pipe(take(1)))
      ).subscribe((userId) => {
        this.multiCartFacade.reloadCart(OCC_CART_ID_CURRENT);
        this.multiCartFacade.loadCart({cartId: OCC_CART_ID_CURRENT, userId});
        this.eventService.dispatch(
          new CheckoutAdyenConfigurationReloadEvent()
        );
      })
    );
  }

  private getEcontextConfiguration(
    adyenConfig: AdyenConfigData
  ): EcontextConfiguration {
    const address = this.deliveryAddress;

    const data: EcontextInputSchema = {
      firstName: address?.firstName,
      lastName: address?.lastName,
      shopperEmail: address?.email || adyenConfig.shopperEmail,
      telephoneNumber: address?.phone || address?.cellphone
    };

    const personalDetailsRequired = [
      data.firstName,
      data.lastName,
      data.shopperEmail,
      data.telephoneNumber
    ].some(value => !value?.trim());

    return {
      personalDetailsRequired,
      data
    };
  }

  private resetDropInComponent() {
    this.dropIn.unmount();
    this.dropIn.mount(this.hook.nativeElement)
  }

}
