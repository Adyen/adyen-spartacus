import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {I18nModule, provideDefaultConfig, UrlModule} from '@spartacus/core';
import {IconModule, OutletPosition, provideOutlet} from '@spartacus/storefront';
import {AdyenCartModificationListener} from './adyen-cart-modification.listener';
import {AdyenCartModificationInterceptor} from './adyen-cart-modification.interceptor';
import {AdyenSubscriptionLinkComponent} from './adyen-subscription-link.component';
import {adyenSubscriptionsRoutingConfig} from '../config/adyen-subscriptions-routing-config';

@NgModule({
  imports: [CommonModule, RouterModule, I18nModule, UrlModule, IconModule],
  declarations: [AdyenSubscriptionLinkComponent],
  exports: [AdyenSubscriptionLinkComponent],
  providers: [
    {provide: HTTP_INTERCEPTORS, useExisting: AdyenCartModificationInterceptor, multi: true},
    provideDefaultConfig(adyenSubscriptionsRoutingConfig),
    // directly below `cx-global-message`, which sits inside the `cx-header` outlet of the storefront template
    provideOutlet({id: 'cx-header', position: OutletPosition.AFTER, component: AdyenSubscriptionLinkComponent})
  ]
})
export class AdyenCartModificationModule {
  constructor(_adyenCartModificationListener: AdyenCartModificationListener) {
  }
}
