import {Component, OnDestroy, OnInit} from '@angular/core';
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
import {Subscription} from "rxjs";

@Component({
  selector: 'adyen-redirect-error',
  templateUrl: './adyen-redirect.component.html',
  standalone: false
})
export class AdyenRedirectErrorComponent implements OnInit, OnDestroy {
  private messageTimeout: number = 20000;
  private placeOrderErrorCodePrefix: string = errorCodePrefix + '.';
  private subscriptions = new Subscription();

  constructor(protected routingService: RoutingService,
              protected globalMessageService: GlobalMessageService,
              protected multiCartFacade: MultiCartFacade,
              protected userIdService: UserIdService,
              protected translationService: TranslationService,
  ) {
  }

  private addErrorMessage() {
    let subscribeRouting = this.routingService.getParams().subscribe(params => {
      let errorCode = params['errorCode'];
      let productCode = params['productCode']
      let isExpressCart = params['isExpressCart']

      if (errorCode) {
        let decodedError = atob(errorCode);

        this.translationService.translate(this.placeOrderErrorCodePrefix + decodedError).subscribe(message => {
          this.globalMessageService.add(message, GlobalMessageType.MSG_TYPE_ERROR, this.messageTimeout);
        })

        if (productCode) {
          this.routingService.goByUrl("/p/" + productCode)
        } else {
          this.multiCartFacade.reloadCart(OCC_CART_ID_CURRENT)

          let subscribeUser = this.userIdService.takeUserId().subscribe((userId) => {
            this.multiCartFacade.loadCart({cartId: OCC_CART_ID_CURRENT, userId})


            let subscribeCart = this.multiCartFacade.getCartIdByType(CartType.ACTIVE).subscribe((cartId) => {
              if (isExpressCart && isExpressCart === "true") {
                this.routingService.go({cxRoute: "cart"})
              } else {
                this.routingService.go({cxRoute: "checkoutAdyenPaymentDetails"})
              }
            });
            this.subscriptions.add(subscribeCart);
          });
          this.subscriptions.add(subscribeUser);
        }
      }
    });
    this.subscriptions.add(subscribeRouting);
  }


  ngOnInit(): void {
    this.addErrorMessage();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
