import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OccAdyenOrderAdapter } from './occ-adyen-order.adapter';
import { OccEndpointsService } from '@spartacus/core';
import { PlaceOrderRequest, PlaceOrderResponse } from '../../models/occ.order.models';

describe('OccAdyenOrderAdapter', () => {
  let adapter: OccAdyenOrderAdapter;
  let httpMock: HttpTestingController;
  let occEndpointsService: jasmine.SpyObj<OccEndpointsService>;

  beforeEach(() => {
    const occEndpointsServiceSpy = jasmine.createSpyObj('OccEndpointsService', ['buildUrl']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OccAdyenOrderAdapter,
        { provide: OccEndpointsService, useValue: occEndpointsServiceSpy }
      ]
    });

    adapter = TestBed.inject(OccAdyenOrderAdapter);
    httpMock = TestBed.inject(HttpTestingController);
    occEndpointsService = TestBed.inject(OccEndpointsService) as jasmine.SpyObj<OccEndpointsService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  it('should call placeOrder and return PlaceOrderResponse', () => {
    const userId = 'testUser';
    const cartId = 'testCart';
    const orderData: PlaceOrderRequest = {
      paymentRequest: { /* mock payment request data */ }
    };
    const mockResponse: PlaceOrderResponse = {
      success: true,
      executeAction: false,
      paymentsAction: undefined,
      error: undefined,
      errorFieldCodes: [],
      orderNumber: '12345',
      orderData: { /* mock order data */ }
    };

    occEndpointsService.buildUrl.and.returnValue(`users/${userId}/carts/${cartId}/adyen/place-order`);

    adapter.placeOrder(userId, cartId, orderData).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`users/${userId}/carts/${cartId}/adyen/place-order`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should call cancelPayment and return void', () => {
    const userId = 'testUser';
    const cartId = 'testCart';
    const orderCode = 'order123';

    occEndpointsService.buildUrl.and.returnValue(`users/${userId}/adyen/payment-canceled/${orderCode}`);

    adapter.cancelPayment(userId, cartId, orderCode).subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`users/${userId}/adyen/payment-canceled/${orderCode}`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });
});
