import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SubmitActions, SubmitData, UIElement, AdditionalDetailsActions} from "@adyen/adyen-web";
import {AdyenCheckout, AdyenCheckoutError, Intent, PayPal} from '@adyen/adyen-web/auto';
import {AdyenExpressConfigData} from "../../core/models/occ.config.models";
import {AdyenExpressOrderService} from "../../service/adyen-express-order.service";
import {EventService, Product, RoutingService, UserIdService,} from '@spartacus/core';
import {ActiveCartFacade, MultiCartFacade} from '@spartacus/cart/base/root';
import {getAdyenExpressCheckoutConfig} from "../adyenCheckoutConfig.util";
import {PaypalExpressService} from "../service/paypal-express.service";
import {ExpressPaymentBase} from "../base/express-payment-base";
import {AdyenCartService} from "../../service/adyen-cart-service";
import {PlaceOrderResponse} from "../../core/models/occ.order.models";

@Component({
    selector: 'cx-paypal-express-payment',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './paypal-express-payment.component.html',
    styleUrls: ['./paypal-express-payment.component.css']
})
export class PaypalExpressPaymentComponent extends ExpressPaymentBase implements OnInit, OnDestroy {

    @Input()
    product: Product;

    @Input()
    configuration: AdyenExpressConfigData;

    paypal!: PayPal;

    private authorizedPaymentData: any;

    constructor(
        protected adyenOrderService: AdyenExpressOrderService,
        protected routingService: RoutingService,
        protected activeCartFacade: ActiveCartFacade,
        protected paypalExpressService: PaypalExpressService,
        protected override activeCartService: ActiveCartFacade,
        protected override multiCartService: MultiCartFacade,
        protected override userIdService: UserIdService,
        protected override adyenCartService: AdyenCartService,
        protected override eventService: EventService
    ) {
        super(multiCartService, userIdService, activeCartService, adyenCartService, eventService)
    }

    ngOnInit(): void {
        this.initialize();
    }

    private initialize() {
        if (this.configuration) {
            this.setupAdyenCheckout(this.configuration); // Existing logic encapsulated into functions.
        }
    }

    private async setupAdyenCheckout(config: AdyenExpressConfigData) {

        const adyenCheckout = await AdyenCheckout(getAdyenExpressCheckoutConfig(config));

        if (config.expressPaymentConfig && (this.product && config.expressPaymentConfig.paypalExpressEnabledOnProduct || config.expressPaymentConfig.paypalExpressEnabledOnCart)) {
            this.paypal = new PayPal(adyenCheckout, {

                amount: {
                    currency: config.amount.currency,
                    value: config.amount.value
                },

                isExpress: true,
                blockPayPalVenmoButton: true,
                blockPayPalCreditButton: true,
                blockPayPalPayLaterButton: true,

                intent: config.payPalIntent as Intent,

                onSubmit: (state: SubmitData, component: UIElement, actions: SubmitActions) => {
                    console.log('Submitting PayPal data:', state.data);
                    this.handlePayPalSubmit(state, component, actions);
                },
                onAuthorized: (paymentData, actions) => {
                    this.authorizedPaymentData = paymentData;
                    //actions.resolve();
                    this.handleAutorise(paymentData,actions)
                    //this.onPayPalAuthorize(this.getPayPalUrl(), this.prepareDataPayPal(paymentData), actions.resolve, actions.reject)
                },
                onAdditionalDetails: (additionalDetailsData, element, actions) => {
                    console.log(additionalDetailsData);
                    //this.makePayment(state.data, this.getAdditionalDataUrl())
                    this.handleAdditionalDetails(additionalDetailsData.data, actions)
                },
                onError: (error) => this.handleError(error)
            }).mount("#paypal-button");
        }
    }

    private handlePayPalSubmit(state: SubmitData, component: UIElement, actions: SubmitActions) {
        this.initializeCart(this.product).then(() => {
          console.log(this.cartId)
            if (!this.cartId) {
                console.error("cartId is undefined");
                actions.reject();
                return;
            }
            this.paypalExpressService.submitPayPal(state.data, this.product, this.cartId).subscribe({
                next: (result) => {
                    if (result?.paymentResponse?.action) {
                        component.handleAction(result.paymentResponse.action);
                    }
                },
                error: (error) => {
                    console.log(error);
                    actions.reject();
                },
            });
        }).catch((e) => {
            console.log(e);
            return actions.reject();
        });
    }

    private handleAutorise(state: any, actions: any) {
        if (this.cartId) {
            this.adyenOrderService.adyenPlacePayPalExpressOrder(state.data, this.authorizedPaymentData, this.product, this.cartId).subscribe(
                result => {
                    if (result?.success) {
                        if (result.executeAction && result.paymentsAction !== undefined) {
                            this.paypal.handleAction(result.paymentsAction);
                        } else {
                            this.onSuccess();
                        }
                    } else {
                        console.error(result?.error);
                        actions.reject();
                    }
                    actions.resolve({resultCode: result.paymentsResponse?.resultCode});
                },
                error => {
                    console.error(error);
                    actions.reject();
                }
            );
        } else {
            console.error("cartId is undefined");
            actions.reject();
        }
    }

    private handleAdditionalDetails(details: any, actions: AdditionalDetailsActions) {
        if (this.cartId) {
            this.adyenOrderService.sendAdditionalExpressDetails(details, this.cartId).subscribe(
                result => {
                    this.handleResponse(result, actions);
                }
            );
        } else {
            console.error("cartId is undefined");
            actions.reject();
        }
    }

    private handleResponse(response: PlaceOrderResponse | void, actions: SubmitActions) {
        if (!!response) {
            if (response.success) {
                if (response.executeAction === true && !!response.paymentsAction) {
                    this.paypal.handleAction(response.paymentsAction)
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
            }
        }
    }

    handleError(error: AdyenCheckoutError) {
    }

    onSuccess(): void {
        this.routingService.go({cxRoute: 'orderConfirmation'});
    }
}
