import {TestBed} from '@angular/core/testing';
import {HttpClient, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {AdyenCartModificationInterceptor} from './adyen-cart-modification.interceptor';
import {AdyenCartModificationService} from './adyen-cart-modification.service';

describe('AdyenCartModificationInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let cartModificationService: jasmine.SpyObj<AdyenCartModificationService>;

  beforeEach(() => {
    cartModificationService = jasmine.createSpyObj('AdyenCartModificationService', ['notify']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {provide: AdyenCartModificationService, useValue: cartModificationService},
        {provide: HTTP_INTERCEPTORS, useExisting: AdyenCartModificationInterceptor, multi: true}
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('reports the CartModification returned by an update-entry PATCH', () => {
    const body = {statusCode: 'subscriptionQuantityLimit', quantityAdded: 1};
    http.patch('/occ/v2/electronics/users/current/carts/0001/entries/0?fields=FULL', {quantity: 3}).subscribe();
    controller.expectOne(() => true).flush(body);
    expect(cartModificationService.notify).toHaveBeenCalledWith(body, 'cart');
  });

  it('ignores add-entry (handled via the event), other methods and other URLs', () => {
    http.post('/occ/v2/electronics/users/current/carts/0001/entries', {}).subscribe();
    controller.expectOne(() => true).flush({statusCode: 'subscriptionAlreadyOwned'});
    http.get('/occ/v2/electronics/users/current/carts/0001/entries/0').subscribe();
    controller.expectOne(() => true).flush({statusCode: 'subscriptionAlreadyOwned'});
    http.patch('/occ/v2/electronics/users/current/carts/0001', {}).subscribe();
    controller.expectOne(() => true).flush({statusCode: 'subscriptionAlreadyOwned'});
    expect(cartModificationService.notify).not.toHaveBeenCalled();
  });
});
