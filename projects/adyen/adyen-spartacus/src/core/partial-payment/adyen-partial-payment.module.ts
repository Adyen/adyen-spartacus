import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdyenPartialPaymentService } from '../../service/adyen-partial-payment.service';
import { AdyenPartialPaymentConnector } from '../connectors/adyen-partial-payment.connector';
import { OccAdyenPartialPaymentAdapter } from '../occ/adapters/occ-adyen-partial-payment.adapter';

@NgModule({
  imports: [CommonModule],
  providers: [
    AdyenPartialPaymentService,
    {
      provide: AdyenPartialPaymentConnector,
      useClass: OccAdyenPartialPaymentAdapter,
    },
  ],
})
export class AdyenPartialPaymentModule {}