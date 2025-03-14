import {CheckoutEvent} from "@spartacus/checkout/base/root";

export abstract class CheckoutAdyenConfigurationEvent extends CheckoutEvent{}

export class CheckoutAdyenConfigurationReloadEvent extends CheckoutAdyenConfigurationEvent {
  readonly type = 'CheckoutAdyenConfigurationReloadEvent';
  constructor() {
    super();
  }
}

export class ExpressCheckoutSuccessfulEvent extends CheckoutEvent {
  readonly type = 'ExpressCheckoutSuccessfulEvent';
  constructor() {
    super();
  }
}

export class ExpressCheckoutWithAdditionalDetailsSuccessfulEvent extends CheckoutEvent {
  readonly type = 'PayPalExpressCheckoutSuccessfulEvent';
  constructor() {
    super();
  }
}
