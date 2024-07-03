import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Subscription, timer} from 'rxjs';
import {OrderPaymentStatusService} from "./service/order-payment-status.service";

@Component({
  selector: 'cx-order-confirmation-status',
  templateUrl: './order-confirmation-payment-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderConfirmationPaymentStatusComponent implements OnInit, OnDestroy {

  constructor(protected orderPaymentStatusService: OrderPaymentStatusService) {
  }

  private timerDelay = 5000; //ms
  private numberOfRetries = 30;
  private currentRetry = 1;

  paymentStatus$: BehaviorSubject<string | undefined>;

  private timer: Subscription


  private timerCallback() {
    if (this.currentRetry <= this.numberOfRetries) {
      console.log("timer " + this.currentRetry + " " + new Date());
      this.orderPaymentStatusService.getOrderStatus("00004004").subscribe((status) => {
        this.paymentStatus$.next(status);
        if (status !== 'waiting') {
          this.timer.unsubscribe();
        }
      })

      this.currentRetry++;
    } else {
      console.log('complete')
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
