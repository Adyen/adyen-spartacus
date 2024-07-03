import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ConfigModule} from '@spartacus/core';

import {OrderConfirmationPaymentStatusComponent} from "./order-confirmation-payment-status.component";
import {OrderConfirmationStatusPending} from "./statuses/pending/order-confirmation-status-pending";
import {OrderConfirmationStatusSuccess} from "./statuses/success/order-confirmation-status-success";
import {OrderConfirmationStatusFailed} from "./statuses/failed/order-confirmation-status-failed";
import {OrderConfirmationStatusRejected} from "./statuses/rejected/order-confirmation-status-rejected";
import {OrderConfirmationStatusTimeout} from "./statuses/timeout/order-confirmation-status-timeout";
import {OccOrderStatusAdapter} from "./occ/occ-order-status.adapter";
import {OrderPaymentStatusConnector} from "./connector/order-payment-status.connector";
import {OrderPaymentStatusService} from "./service/order-payment-status.service";

@NgModule({
  imports: [CommonModule,
    OrderConfirmationStatusPending,
    OrderConfirmationStatusSuccess,
    OrderConfirmationStatusFailed,
    OrderConfirmationStatusRejected,
    OrderConfirmationStatusTimeout,
    ConfigModule.withConfig({
      cmsComponents: {
        AdyenOrderPaymentStatusComponent: {
          component: OrderConfirmationPaymentStatusComponent
        }
      }
    })],
  providers: [
    // provideDefaultConfig(<CmsConfig>{
    //   cmsComponents: {
    //     OrderConfirmationPaymentStatus: {
    //       component: OrderConfirmationPaymentStatusComponent,
    //     },
    //   },
    // }),
    OccOrderStatusAdapter,
    OrderPaymentStatusConnector,
    OrderPaymentStatusService
  ],
  declarations: [OrderConfirmationPaymentStatusComponent],
  exports: [OrderConfirmationPaymentStatusComponent],
})
export class OrderConfirmationPaymentStatusModule {
}
