import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AdyenRedirectSuccessComponent} from "./adyen-redirect-success.component";
import {RouterModule, Routes} from '@angular/router';
import {AdyenRedirectErrorComponent} from "./adyen-redirect-error.component";


const STATIC_ROUTES: Routes = [
  {path: 'adyen/redirect/error/:errorCode', component: AdyenRedirectErrorComponent},
  {path: 'adyen/redirect/:orderCode', component: AdyenRedirectSuccessComponent}
]

@NgModule({
  declarations: [
    AdyenRedirectSuccessComponent,
    AdyenRedirectErrorComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(STATIC_ROUTES)
  ]
})
export class AdyenRedirectModule {
}
