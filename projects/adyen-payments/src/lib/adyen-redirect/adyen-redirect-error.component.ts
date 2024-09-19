import {Component, OnInit} from '@angular/core';
import {CartType, MultiCartFacade} from '@spartacus/cart/base/root';
import {
  GlobalMessageService,
  GlobalMessageType,
  OCC_CART_ID_CURRENT,
  RoutingService,
  TranslationService,
  UserIdService
} from '@spartacus/core';
import {errorCodePrefix} from "../assets/translations/translations";

@Component({
  selector: 'adyen-redirect-error',
  templateUrl: './adyen-redirect.component.html',
})
export class AdyenRedirectErrorComponent implements OnInit {
  private messageTimeout: number = 20000;
  private placeOrderErrorCodePrefix: string = errorCodePrefix + '.';

  constructor(protected routingService: RoutingService,
              protected globalMessageService: GlobalMessageService,
              protected multiCartFacade: MultiCartFacade,
              protected userIdService: UserIdService,
              protected translationService: TranslationService,
  ) {
  }

  private addErrorMessage() {
    this.routingService.getParams().subscribe(params => {
      let errorCode = params['errorCode'];

      if (errorCode) {
        let decodedError = atob(errorCode);

        this.translationService.translate(this.placeOrderErrorCodePrefix + decodedError).subscribe(message => {
          this.globalMessageService.add(message, GlobalMessageType.MSG_TYPE_ERROR, this.messageTimeout);
        })

        this.multiCartFacade.reloadCart(OCC_CART_ID_CURRENT)

        this.userIdService.takeUserId().subscribe((userId) => {
          this.multiCartFacade.loadCart({cartId: OCC_CART_ID_CURRENT, userId})

          this.multiCartFacade.getCartIdByType(CartType.ACTIVE).subscribe((cartId) => {
            this.routingService.go({cxRoute: "checkoutAdyenPaymentDetails"})
          })
        })
      }
    })
  }


  ngOnInit(): void {
    this.addErrorMessage();
  }

}
