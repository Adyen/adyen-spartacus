import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OccAdditionalDetailsAdapter } from './occ-additionaldetails.adapter';
import { OccEndpointsService } from '@spartacus/core';
import { PlaceOrderRequest, PlaceOrderResponse } from '../../models/occ.order.models';

describe('OccAdditionalDetailsAdapter', () => {
  let adapter: OccAdditionalDetailsAdapter;
  let httpMock: HttpTestingController;
  let occEndpointsService: jasmine.SpyObj<OccEndpointsService>;

  beforeEach(() => {
    const occEndpointsServiceSpy = jasmine.createSpyObj('OccEndpointsService', ['buildUrl']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OccAdditionalDetailsAdapter,
        { provide: OccEndpointsService, useValue: occEndpointsServiceSpy }
      ]
    });

    adapter = TestBed.inject(OccAdditionalDetailsAdapter);
    httpMock = TestBed.inject(HttpTestingController);
    occEndpointsService = TestBed.inject(OccEndpointsService) as jasmine.SpyObj<OccEndpointsService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  it('should call sendAdditionalDetails and return PlaceOrderResponse', () => {
    const userId = 'testUser';
    const cartId = 'testCart';
    const details: PlaceOrderRequest = {
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

    occEndpointsService.buildUrl.and.returnValue(`users/${userId}/carts/${cartId}/adyen/additional-details`);

    adapter.sendAdditionalDetails(userId, cartId, details).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`users/${userId}/carts/${cartId}/adyen/additional-details`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
