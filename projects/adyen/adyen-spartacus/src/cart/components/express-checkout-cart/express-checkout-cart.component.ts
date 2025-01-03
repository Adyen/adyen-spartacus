import { Component, OnDestroy, OnInit } from '@angular/core';
import {CheckoutAdyenConfigurationService} from "../../../service/checkout-adyen-configuration.service";
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { UserIdService } from '@spartacus/core';
import {AdyenConfigData} from "../../../core/models/occ.config.models";
import {Subject, Subscription, filter, switchMap } from 'rxjs';

@Component({
  selector: 'cx-express-checkout-cart',
  templateUrl: './express-checkout-cart.component.html',
  styleUrl: './express-checkout-cart.component.scss'
})
export class ExpressCheckoutCartComponent implements OnInit, OnDestroy{
  protected subscriptions = new Subscription();


  configuration$: Subject<AdyenConfigData> = new Subject();

  constructor(protected  activeCartFacade: ActiveCartFacade,
              protected userIdService: UserIdService,
              protected checkoutAdyenConfigurationService: CheckoutAdyenConfigurationService
  ) {
  }


  ngOnInit(): void {
    let subscription = this.activeCartFacade.getActiveCartId().pipe(
      filter(cartId => !!cartId),
      switchMap(cartId => this.userIdService.takeUserId().pipe(
        switchMap(userId => this.checkoutAdyenConfigurationService.fetchCheckoutConfiguration(userId, cartId))
      ))
    ).subscribe(async config => {
      if (config) {
        this.configuration$.next(config)
      }
    });
    this.subscriptions.add(subscription);
    }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
