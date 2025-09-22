import {Component, OnDestroy, OnInit} from '@angular/core';
import {CheckoutAdyenConfigurationService} from "../../../service/checkout-adyen-configuration.service";
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {EventService, UserIdService} from '@spartacus/core';
import {AdyenExpressConfigData} from "../../../core/models/occ.config.models";
import {BehaviorSubject, Subscription} from 'rxjs';
import {CheckoutAdyenConfigurationReloadEvent} from "../../../events/checkout-adyen.events";

@Component({
  selector: 'cx-express-checkout-cart',
  templateUrl: './express-checkout-cart.component.html',
  styleUrl: './express-checkout-cart.component.scss',
  standalone: false
})
export class ExpressCheckoutCartComponent implements OnInit, OnDestroy {
  protected subscriptions = new Subscription();

  configuration$ = new BehaviorSubject<AdyenExpressConfigData | null>(null);

  constructor(protected activeCartFacade: ActiveCartFacade,
              protected userIdService: UserIdService,
              protected checkoutAdyenConfigurationService: CheckoutAdyenConfigurationService,
              protected eventService: EventService
  ) {
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.eventService.get(CheckoutAdyenConfigurationReloadEvent).subscribe(event => {
        console.log(event);
        this.configuration$.next(null);

        this.subscriptions.add(
          this.checkoutAdyenConfigurationService.fetchExpressCheckoutCartConfiguration().subscribe((configuration: AdyenExpressConfigData) => {
            this.configuration$.next(configuration);
          }))
      })
    );

    this.subscriptions.add(
      this.checkoutAdyenConfigurationService.fetchExpressCheckoutCartConfiguration().subscribe((configuration: AdyenExpressConfigData) => {
        this.configuration$.next(configuration);
      }))
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()
  }

}
