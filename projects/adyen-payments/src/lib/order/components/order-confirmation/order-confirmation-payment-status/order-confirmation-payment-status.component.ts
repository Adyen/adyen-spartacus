import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Subscription, timer} from 'rxjs';
import {OrderPaymentStatusService} from "./service/order-payment-status.service";
import {AdyenOrderService} from "../../../../service/adyen-order.service";

@Component({
  selector: 'cx-order-confirmation-status',
  templateUrl: './order-confirmation-payment-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./order-confirmation-payment-status.scss'],
})
export class OrderConfirmationPaymentStatusComponent implements OnInit, OnDestroy {

  constructor(protected orderPaymentStatusService: OrderPaymentStatusService,
              protected adyenOrderService: AdyenOrderService) {
    adyenOrderService.getOrderDetails().subscribe(orderData => {
      this.orderCode = orderData!.code as string;
    })
  }

  private timerDelay = 5000; //ms
  private numberOfRetries = 30;
  private currentRetry = 1;

  private orderCode: string;

  paymentStatus$: BehaviorSubject<string | undefined>;

  private timer: Subscription


  private timerCallback() {
    if (this.currentRetry <= this.numberOfRetries) {
      this.orderPaymentStatusService.getOrderStatus(this.orderCode).subscribe((status) => {
        this.paymentStatus$.next(status);
        if (status !== 'waiting') {
          this.timer.unsubscribe();
        }
      })

      this.currentRetry++;
    } else {
      this.paymentStatus$.next("timeout");
      this.timer.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.paymentStatus$ = new BehaviorSubject<string | undefined>('waiting');
    let source = timer(this.timerDelay, this.timerDelay);
    this.timer = source.subscribe(() => this.timerCallback());
  }

  ngOnDestroy(): void {
    this.timer.unsubscribe();
  }
}
