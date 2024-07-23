import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild,} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {CheckoutDeliveryAddressFacade, CheckoutPaymentFacade,} from '@spartacus/checkout/base/root';
import {
  Address,
  getLastValueSync,
  GlobalMessageService,
  PaymentDetails,
  RoutingService,
  TranslationService,
  UserPaymentService,
} from '@spartacus/core';
import {BehaviorSubject, Subscription,} from 'rxjs';
import {filter, map, take,} from 'rxjs/operators';
import {CheckoutStepService} from "@spartacus/checkout/base/components";
import AdyenCheckout from '@adyen/adyen-web';
import {CheckoutAdyenConfigurationService} from "../service/checkout-adyen-configuration.service";
import {AdyenConfigData} from "../core/models/occ.config.models";
import DropinElement from "@adyen/adyen-web/dist/types/components/Dropin";
import {CoreOptions} from "@adyen/adyen-web/dist/types/core/types";
import {ActionHandledReturnObject, OnPaymentCompletedData} from "@adyen/adyen-web/dist/types/components/types";
import UIElement from "@adyen/adyen-web/dist/types/components/UIElement";
import AdyenCheckoutError from "@adyen/adyen-web/dist/types/core/Errors/AdyenCheckoutError";
import {PlaceOrderResponse} from "../core/models/occ.order.models";
import {AdyenOrderService} from "../service/adyen-order.service";

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
  dropIn: DropinElement;

  isGuestCheckout = false;
  paymentDetails?: PaymentDetails;
  billingAddress?: Address = undefined;


  get backBtnText() {
    return this.checkoutStepService.getBackBntText(this.activatedRoute);
  }


  constructor(
    protected userPaymentService: UserPaymentService,
    protected checkoutDeliveryAddressFacade: CheckoutDeliveryAddressFacade,
    protected checkoutPaymentFacade: CheckoutPaymentFacade,
    protected activatedRoute: ActivatedRoute,
    protected translationService: TranslationService,
    protected routingService: RoutingService,
    protected activeCartFacade: ActiveCartFacade,
    protected checkoutStepService: CheckoutStepService,
    protected globalMessageService: GlobalMessageService,
    protected checkoutAdyenConfigurationService: CheckoutAdyenConfigurationService,
    protected adyenOrderService: AdyenOrderService
  ) {
  }

  ngOnInit(): void {
    this.sessionId = this.activatedRoute.snapshot.queryParamMap.get('sessionId') || '';

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


    this.checkoutAdyenConfigurationService.getCheckoutConfigurationState()
      .pipe(
        filter((state) => !state.loading),
        take(1),
        map((state) => state.data)
      ).subscribe((async config => {
        if (config) {
          const adyenCheckout = await AdyenCheckout(this.getAdyenCheckoutConfig(config));
          this.dropIn = adyenCheckout.create("dropin").mount(this.hook.nativeElement);
        }
      })
    );

  }

  private getAdyenCheckoutConfig(adyenConfig: AdyenConfigData): CoreOptions {
    return {
      paymentMethodsConfiguration: {
        card: {
          type: 'card',
          hasHolderName: true,
          holderNameRequired: adyenConfig.cardHolderNameRequired,
          enableStoreDetails: adyenConfig.showRememberTheseDetails
        }
      },
      paymentMethodsResponse: {
        paymentMethods: adyenConfig.paymentMethods,
        storedPaymentMethods: adyenConfig.storedPaymentMethodList
      },
      locale: adyenConfig.shopperLocale,
      environment: adyenConfig.environmentMode,
      clientKey: adyenConfig.adyenClientKey,
      session: {
        id: adyenConfig.sessionData.id,
        sessionData: adyenConfig.sessionData.sessionData
      },
      analytics: {
        enabled: false
      },
      onPaymentCompleted(data: OnPaymentCompletedData, element?: UIElement) {
        console.info(data, element);
      },
      onError(error: AdyenCheckoutError, element?: UIElement) {
        console.error(error.name, error.message, error.stack, element);
      },
      onSubmit: (state: any, element: UIElement) => this.handlePayment(state.data),
      //onAdditionalDetails: (state: any, element?: UIElement) => this.handleAdditionalDetails(state.data),
      onActionHandled(data: ActionHandledReturnObject) {
        console.log("onActionHandled", data);
      }
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

  private resetDropInComponent() {
    this.dropIn.unmount();
    this.dropIn.mount(this.hook.nativeElement)
  }

}
