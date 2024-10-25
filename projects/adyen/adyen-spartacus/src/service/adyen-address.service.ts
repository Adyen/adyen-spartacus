import {Injectable} from "@angular/core";
import {AdyenBaseService} from "./adyen-base.service";
import {Observable, switchMap} from "rxjs";
import {Address, Command, CommandService, UserAddressConnector, UserIdService} from "@spartacus/core"
import {ActiveCartFacade} from '@spartacus/cart/base/root';


@Injectable()
export class AdyenAddressService extends AdyenBaseService {

  constructor(
    private userAddressConnector: UserAddressConnector,
    protected commandService: CommandService,
    protected override userIdService: UserIdService,
    protected override activeCartFacade: ActiveCartFacade
  ) {
    super(userIdService, activeCartFacade);
  }

  protected adyenAddUserAddressCommand: Command<any, Address> =
    this.commandService.create<any, Address>(
      (billingAddress) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId]) =>
            this.userAddressConnector.add(userId, billingAddress)
          )
        )
    )

  adyenAddUserAddress(billingAddress: Address): Observable<Address> {
    return this.adyenAddUserAddressCommand.execute(billingAddress);
  }
}
