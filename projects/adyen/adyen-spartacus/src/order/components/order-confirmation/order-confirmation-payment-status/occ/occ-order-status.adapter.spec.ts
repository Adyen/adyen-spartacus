import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OccOrderStatusAdapter } from './occ-order-status.adapter';
import { OccEndpointsService } from '@spartacus/core';

describe('OccOrderStatusAdapter', () => {
  let adapter: OccOrderStatusAdapter;
  let httpMock: HttpTestingController;
  let occEndpointsService: jasmine.SpyObj<OccEndpointsService>;

  beforeEach(() => {
    const occEndpointsServiceSpy = jasmine.createSpyObj('OccEndpointsService', ['buildUrl']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OccOrderStatusAdapter,
        { provide: OccEndpointsService, useValue: occEndpointsServiceSpy }
      ]
    });

    adapter = TestBed.inject(OccOrderStatusAdapter);
    httpMock = TestBed.inject(HttpTestingController);
    occEndpointsService = TestBed.inject(OccEndpointsService) as jasmine.SpyObj<OccEndpointsService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });

  it('should get order payment status', () => {
    const mockUserId = 'testUser';
    const mockOrderCode = 'testOrder';
    const mockStatus = 'completed';
    const mockUrl = `users/${mockUserId}/adyen/payment-status/${mockOrderCode}`;

    occEndpointsService.buildUrl.and.returnValue(mockUrl);

    adapter.getOrderPaymentStatus(mockUserId, mockOrderCode).subscribe((status) => {
      expect(status).toBe(mockStatus);
    });

    const req = httpMock.expectOne(mockUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockStatus);
  });
});
