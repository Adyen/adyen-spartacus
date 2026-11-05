import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import {AdyenCartModificationService} from './adyen-cart-modification.service';

/**
 * Spartacus' update-entry effect discards the OCC `CartModification` (`CartUpdateEntrySuccessEvent` has no
 * `statusCode`), so a quantity capped by the duplicate-subscription guard would go unnoticed. This reads the
 * response of `PATCH/PUT .../carts/{cartId}/entries/{n}` instead. Spartacus reloads the cart afterwards.
 */
@Injectable({providedIn: 'root'})
export class AdyenCartModificationInterceptor implements HttpInterceptor {
  protected updateEntryUrl: RegExp = /\/carts\/[^/]+\/entries\/\d+(\?|$)/;

  constructor(protected cartModificationService: AdyenCartModificationService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isUpdateEntry(request)) {
      return next.handle(request);
    }
    return next.handle(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse && event.body) {
          this.cartModificationService.notify(event.body, 'cart');
        }
      })
    );
  }

  protected isUpdateEntry(request: HttpRequest<any>): boolean {
    return (request.method === 'PATCH' || request.method === 'PUT') && this.updateEntryUrl.test(request.url);
  }
}
