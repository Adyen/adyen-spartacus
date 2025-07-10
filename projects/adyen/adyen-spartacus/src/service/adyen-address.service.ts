import {Injectable} from "@angular/core";
import {AdyenBaseService} from "./adyen-base.service";
import {Observable, switchMap} from "rxjs";
import {Command, CommandService, UserIdService} from "@spartacus/core"
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {AdyenCheckoutBillingAddressConnector} from "../core/connectors/adyen-checkout-billing-address.connector";
import {BillingAddress} from "../core/models/occ.order.models";


@Injectable()
export class AdyenAddressService extends AdyenBaseService {

  constructor(
    private adyenCheckoutBillingAddressConnector: AdyenCheckoutBillingAddressConnector,
    protected commandService: CommandService,
    protected override userIdService: UserIdService,
    protected override activeCartFacade: ActiveCartFacade
  ) {
    super(userIdService, activeCartFacade);
  }

  protected adyenAddUserAddressCommand: Command<any, BillingAddress> =
    this.commandService.create<any, BillingAddress>(
      (billingAddress) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId]) =>
            this.adyenCheckoutBillingAddressConnector.createBillingAddress(userId, billingAddress)
          )
        )
    )

  adyenAddUserAddress(billingAddress: BillingAddress): Observable<BillingAddress> {
    return this.adyenAddUserAddressCommand.execute(billingAddress);
  }
}
