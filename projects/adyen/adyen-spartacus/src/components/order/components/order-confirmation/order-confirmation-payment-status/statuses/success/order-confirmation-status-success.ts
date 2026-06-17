import {Component} from "@angular/core";
import {OrderConfirmationIconSuccess} from "../../icons/success/order-confirmation-icon-success";
import {I18nModule} from "@spartacus/core";

@Component({
  selector: 'cx-order-confirmation-status-success',
  templateUrl: './order-confirmation-status-success.html',
  styleUrls: ['.././order-confirmation-payment-statuses.scss'],
  imports: [
    I18nModule,
    OrderConfirmationIconSuccess
  ],
  standalone: true
})
export class OrderConfirmationStatusSuccess {}
