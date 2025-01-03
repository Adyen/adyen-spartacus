import {Component, OnDestroy, OnInit} from '@angular/core';
import {CurrentProductService} from '@spartacus/storefront';
import {Product, UserIdService,} from '@spartacus/core';
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {filter, Subject, Subscription, switchMap} from 'rxjs';
import {AdyenConfigData} from "../../../core/models/occ.config.models";
import {CheckoutAdyenConfigurationService} from "../../../service/checkout-adyen-configuration.service";

@Component({
  selector: 'cx-express-checkout-product',
  templateUrl: './express-checkout-product.component.html',
  styleUrl: './express-checkout-product.component.css'
})
export class ExpressCheckoutProductComponent implements OnInit, OnDestroy {

  protected subscriptions = new Subscription();


  product: Product | null = null;
  configuration$: Subject<AdyenConfigData> = new Subject();

  constructor(protected currentProductService:CurrentProductService,
              protected  activeCartFacade: ActiveCartFacade,
              protected userIdService: UserIdService,
              protected checkoutAdyenConfigurationService: CheckoutAdyenConfigurationService
  ) {
  }


  ngOnInit() {
    let subscription = this.currentProductService.getProduct().subscribe((product: Product | null) => {
      this.product = product;
    });
    this.subscriptions.add(subscription);

    this.loadConfiguration()
  }

  loadConfiguration(){
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
