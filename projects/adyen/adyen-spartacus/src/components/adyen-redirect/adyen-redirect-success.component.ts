import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {RoutingService} from '@spartacus/core';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {AdyenExpressOrderService} from "../../core/services/adyen-express-order.service";

@Component({
  selector: 'adyen-redirect-success',
  templateUrl: './adyen-redirect.component.html',
  standalone: false
})
export class AdyenRedirectSuccessComponent implements OnInit {

  protected destroyRef = inject(DestroyRef);

  constructor(protected adyenOrderService: AdyenExpressOrderService,
              protected routingService: RoutingService) {
  }

  /**
   * Loads the order from the route and navigates to the confirmation once that order (and not one left in the shared
   * placed-order state by an earlier checkout) is available. Single-shot and bound to the component's lifetime, so it
   * cannot react to later route params such as the order-details page's `:orderCode`.
   */
  protected loadOrderByCode(): void {
    this.routingService.getParams().pipe(
      map(params => params['orderCode']),
      filter((orderCode): orderCode is string => !!orderCode),
      take(1),
      switchMap(orderCode => {
        this.adyenOrderService.loadOrderDetails(orderCode);
        return this.adyenOrderService.getOrderDetails().pipe(
          // Guest orders may be addressed by guid instead of code.
          filter(order => !!order?.code && (order.code === orderCode || order.guid === orderCode)),
          take(1)
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.routingService.go({cxRoute: 'orderConfirmation'}));
  }


  ngOnInit(): void {
    this.loadOrderByCode();
  }

}
