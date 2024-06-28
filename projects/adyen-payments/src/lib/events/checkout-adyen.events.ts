import {CheckoutEvent} from "@spartacus/checkout/base/root";

export abstract class CheckoutAdyenConfigurationEvent extends CheckoutEvent{}

export class CheckoutAdyenConfigurationReloadEvent extends CheckoutAdyenConfigurationEvent {
  readonly type = 'CheckoutAdyenConfigurationReloadEvent';
  constructor(public payload: any) {
    super();
  }
}


