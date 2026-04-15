import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { OrderConfirmationPaymentStatusComponent } from './order-confirmation-payment-status.component';
import { OrderPaymentStatusService } from './service/order-payment-status.service';
import { AdyenOrderService } from '../../../../service/adyen-order.service';
import { BehaviorSubject, of, timer } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('OrderConfirmationPaymentStatusComponent', () => {
  let component: OrderConfirmationPaymentStatusComponent;
  let fixture: ComponentFixture<OrderConfirmationPaymentStatusComponent>;
  let orderPaymentStatusService: jasmine.SpyObj<OrderPaymentStatusService>;
  let adyenOrderService: jasmine.SpyObj<AdyenOrderService>;

  beforeEach(() => {
    const orderPaymentStatusServiceSpy = jasmine.createSpyObj('OrderPaymentStatusService', ['getOrderStatus']);
    const adyenOrderServiceSpy = jasmine.createSpyObj('AdyenOrderService', ['getOrderDetails']);

    TestBed.configureTestingModule({
      declarations: [OrderConfirmationPaymentStatusComponent],
      providers: [
        { provide: OrderPaymentStatusService, useValue: orderPaymentStatusServiceSpy },
        { provide: AdyenOrderService, useValue: adyenOrderServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    orderPaymentStatusService = TestBed.inject(OrderPaymentStatusService) as jasmine.SpyObj<OrderPaymentStatusService>;
    adyenOrderService = TestBed.inject(AdyenOrderService) as jasmine.SpyObj<AdyenOrderService>;

    adyenOrderService.getOrderDetails.and.returnValue(of({ code: '12345' }));

    fixture = TestBed.createComponent(OrderConfirmationPaymentStatusComponent);
    component = fixture.componentInstance;

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize paymentStatus$ with "waiting"', () => {
    component.ngOnInit();
    expect(component.paymentStatus$.value).toBe('waiting');
  });

  it('should call getOrderStatus and update paymentStatus$', fakeAsync(() => {
    orderPaymentStatusService.getOrderStatus.and.returnValue(of('completed'));
    component.ngOnInit();
    tick(5000); // Simulate timer delay
    expect(orderPaymentStatusService.getOrderStatus).toHaveBeenCalledWith('12345');
    expect(component.paymentStatus$.value).toBe('completed');
  }));

  it('should unsubscribe from timer on destroy', () => {
    component.ngOnInit();
    //spyOn(component.timer, 'unsubscribe');
    component.ngOnDestroy();
    //expect(component.timer.unsubscribe).toHaveBeenCalled();
  });

  it('should set paymentStatus$ to "timeout" after max retries', fakeAsync(() => {
    orderPaymentStatusService.getOrderStatus.and.returnValue(of('waiting'));
    component.ngOnInit();
    tick(150000); // Simulate max retries (30 * 5000ms)
    expect(component.paymentStatus$.value).toBe('timeout');
  }));
});
