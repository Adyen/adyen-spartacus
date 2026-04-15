import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OrderPaymentStatusService } from './order-payment-status.service';
import { UserIdService, QueryService } from '@spartacus/core';
import { OrderPaymentStatusConnector } from '../connector/order-payment-status.connector';

describe('OrderPaymentStatusService', () => {
  let service: OrderPaymentStatusService;
  let userIdService: jasmine.SpyObj<UserIdService>;
  let orderPaymentStatusConnector: jasmine.SpyObj<OrderPaymentStatusConnector>;

  beforeEach(() => {
    const userIdServiceSpy = jasmine.createSpyObj('UserIdService', ['takeUserId']);
    const orderPaymentStatusConnectorSpy = jasmine.createSpyObj('OrderPaymentStatusConnector', ['getOrderStatus']);

    TestBed.configureTestingModule({
      providers: [
        OrderPaymentStatusService,
        { provide: UserIdService, useValue: userIdServiceSpy },
        { provide: OrderPaymentStatusConnector, useValue: orderPaymentStatusConnectorSpy },
        { provide: QueryService, useValue: {} }
      ]
    });

    service = TestBed.inject(OrderPaymentStatusService);
    userIdService = TestBed.inject(UserIdService) as jasmine.SpyObj<UserIdService>;
    orderPaymentStatusConnector = TestBed.inject(OrderPaymentStatusConnector) as jasmine.SpyObj<OrderPaymentStatusConnector>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return order status', (done: DoneFn) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    const mockUserId = 'testUser';
    const mockOrderCode = 'testOrder';
    const mockOrderStatus = 'completed';

    userIdService.takeUserId.and.returnValue(of(mockUserId));
    orderPaymentStatusConnector.getOrderStatus.and.returnValue(of(mockOrderStatus));

    service.getOrderStatus(mockOrderCode).subscribe((status) => {
      expect(status).toBe(mockOrderStatus);
      done();
    });

    expect(userIdService.takeUserId).toHaveBeenCalled();
    expect(orderPaymentStatusConnector.getOrderStatus).toHaveBeenCalledWith(mockUserId, mockOrderCode);
  });
});
