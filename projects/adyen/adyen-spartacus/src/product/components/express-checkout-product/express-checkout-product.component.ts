import {Component} from '@angular/core';
import {CurrentProductService} from '@spartacus/storefront';
import {UserIdService,} from '@spartacus/core';
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {CheckoutAdyenConfigurationService} from "../../../service/checkout-adyen-configuration.service";

@Component({
  selector: 'cx-express-checkout-product',
  templateUrl: './express-checkout-product.component.html',
  styleUrl: './express-checkout-product.component.css'
})
export class ExpressCheckoutProductComponent {

  product$ = this.currentProductService.getProduct();

  configuration$= this.checkoutAdyenConfigurationService.fetchExpressCheckoutPDPConfiguration()

  constructor(protected currentProductService: CurrentProductService,
              protected activeCartFacade: ActiveCartFacade,
              protected userIdService: UserIdService,
              protected checkoutAdyenConfigurationService: CheckoutAdyenConfigurationService,
  ) {
  }

}
