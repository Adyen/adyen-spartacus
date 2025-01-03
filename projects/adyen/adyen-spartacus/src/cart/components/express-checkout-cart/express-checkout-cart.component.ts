import {Component} from '@angular/core';
import {CheckoutAdyenConfigurationService} from "../../../service/checkout-adyen-configuration.service";
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {UserIdService} from '@spartacus/core';

@Component({
  selector: 'cx-express-checkout-cart',
  templateUrl: './express-checkout-cart.component.html',
  styleUrl: './express-checkout-cart.component.scss'
})
export class ExpressCheckoutCartComponent {

  configuration$ = this.checkoutAdyenConfigurationService.fetchExpressCheckoutCartConfiguration();

  constructor(protected  activeCartFacade: ActiveCartFacade,
              protected userIdService: UserIdService,
              protected checkoutAdyenConfigurationService: CheckoutAdyenConfigurationService
  ) {
  }

}
