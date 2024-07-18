import { Component } from "@angular/core";
import {OrderConfirmationIconFail} from "../../icons/fail/order-confirmation-icon-fail";
import { I18nModule } from "@spartacus/core";

@Component({
  selector: 'cx-order-confirmation-status-rejected',
  templateUrl: './order-confirmation-status-rejected.html',
  styleUrls: ['.././order-confirmation-payment-statuses.scss'],
  imports: [
    I18nModule,
    OrderConfirmationIconFail
  ],
  standalone: true
})
export class OrderConfirmationStatusRejected {}
