import {Injectable, OnDestroy} from "@angular/core";
import {CheckoutAdyenConfigurationReloadEvent} from "./checkout-adyen.events";
import {merge, Subscription} from "rxjs";
import {CurrencySetEvent, EventService, LanguageSetEvent} from "@spartacus/core";

@Injectable({
  providedIn: 'root',
})
export class CheckoutAdyenEventListener implements OnDestroy{

  protected subscriptions = new Subscription();

  constructor(    protected eventService: EventService) {
    this.onCheckoutAdyenConfigurationReload();
  }

  protected onCheckoutAdyenConfigurationReload(): void {
    this.subscriptions.add(
      merge(
        this.eventService.get(LanguageSetEvent),
        this.eventService.get(CurrencySetEvent)
      ).subscribe(() => {
        console.log('CheckoutAdyenConfigurationReloadEvent');
        this.eventService.dispatch(
          new CheckoutAdyenConfigurationReloadEvent()
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
