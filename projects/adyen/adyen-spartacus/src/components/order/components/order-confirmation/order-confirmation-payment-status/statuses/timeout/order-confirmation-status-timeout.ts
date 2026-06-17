import {Component} from "@angular/core";
import {OrderConfirmationIconTimeout} from "../../icons/timeout/order-confirmation-icon-timeout";
import {I18nModule} from "@spartacus/core";

@Component({
  selector: 'cx-order-confirmation-status-timeout',
  templateUrl: './order-confirmation-status-timeout.html',
  styleUrls: ['.././order-confirmation-payment-statuses.scss'],
  imports: [
    I18nModule,
    OrderConfirmationIconTimeout
  ],
  standalone: true
})
export class OrderConfirmationStatusTimeout {}
