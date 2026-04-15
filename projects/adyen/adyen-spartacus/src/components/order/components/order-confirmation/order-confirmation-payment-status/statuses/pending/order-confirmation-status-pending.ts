import {Component} from "@angular/core";
import {OrderConfirmationPaymentStatusSpinner} from "../../spinner/order-confirmation-payment-status-spinner";
import {I18nModule} from "@spartacus/core";

@Component({
  selector: 'cx-order-confirmation-status-pending',
  templateUrl: './order-confirmation-status-pending.html',
  styleUrls: ['.././order-confirmation-payment-statuses.scss'],
  imports: [
    I18nModule,
    OrderConfirmationPaymentStatusSpinner
  ],
  standalone: true
})
export class OrderConfirmationStatusPending {}
