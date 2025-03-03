import {Component, OnInit} from '@angular/core';
import {RoutingService} from '@spartacus/core';
import {AdyenExpressOrderService} from "../service/adyen-express-order.service";

@Component({
  selector: 'adyen-redirect-success',
  templateUrl: './adyen-redirect.component.html',
})
export class AdyenRedirectSuccessComponent implements OnInit {

  constructor(protected adyenOrderService: AdyenExpressOrderService,
              protected routingService: RoutingService) {
  }

  private loadOrderByCode() {
    this.routingService.getParams().subscribe(params => {
      let orderCode = params['orderCode'];
      if(orderCode){
        this.adyenOrderService.loadOrderDetails(orderCode);
      }
    })

    this.adyenOrderService.getOrderDetails().subscribe((order) => {
      if (order && order.code) {
        this.routingService.go({cxRoute: 'orderConfirmation'});
      }
    })
  }


  ngOnInit(): void {
    this.loadOrderByCode();
  }

}
