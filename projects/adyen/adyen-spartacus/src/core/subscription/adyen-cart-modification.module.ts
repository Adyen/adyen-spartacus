import {NgModule} from '@angular/core';
import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {AdyenCartModificationListener} from './adyen-cart-modification.listener';
import {AdyenCartModificationInterceptor} from './adyen-cart-modification.interceptor';

@NgModule({
  providers: [
    {provide: HTTP_INTERCEPTORS, useExisting: AdyenCartModificationInterceptor, multi: true}
  ]
})
export class AdyenCartModificationModule {
  constructor(_adyenCartModificationListener: AdyenCartModificationListener) {
  }
}
