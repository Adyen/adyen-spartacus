import {Component, OnDestroy, OnInit} from '@angular/core';
import {CurrentProductService} from '@spartacus/storefront';
import {EventService, UserIdService,} from '@spartacus/core';
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {CheckoutAdyenConfigurationService} from "../../../service/checkout-adyen-configuration.service";
import {CheckoutAdyenConfigurationReloadEvent} from "../../../events/checkout-adyen.events";
import {Subject, Subscription} from 'rxjs';
import {AdyenExpressConfigData} from "../../../core/models/occ.config.models";

@Component({
  selector: 'cx-express-checkout-product',
  templateUrl: './express-checkout-product.component.html',
  styleUrl: './express-checkout-product.component.scss',
  standalone: false
})
export class ExpressCheckoutProductComponent implements OnInit, OnDestroy {
  protected subscriptions = new Subscription();


  product$ = this.currentProductService.getProduct();

  configuration$ = new Subject<AdyenExpressConfigData | null>();

  constructor(protected currentProductService: CurrentProductService,
              protected activeCartFacade: ActiveCartFacade,
              protected userIdService: UserIdService,
              protected checkoutAdyenConfigurationService: CheckoutAdyenConfigurationService,
              protected eventService: EventService
  ) {
  }


  ngOnInit(): void {
    this.subscriptions.add(
      this.eventService.get(CheckoutAdyenConfigurationReloadEvent).subscribe(event => {
        this.configuration$.next(null);

        this.subscriptions.add(
          this.checkoutAdyenConfigurationService.fetchExpressCheckoutPDPConfiguration().subscribe((configuration: AdyenExpressConfigData) => {
          this.configuration$.next(configuration);
        })
        )
      })
    );

    this.subscriptions.add(
      this.checkoutAdyenConfigurationService.fetchExpressCheckoutPDPConfiguration().subscribe((configuration: AdyenExpressConfigData) => {
      this.configuration$.next(configuration);
    }))
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe()
  }

}
