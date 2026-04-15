import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdyenRedirectSuccessComponent } from './adyen-redirect-success.component';
import { RoutingService } from '@spartacus/core';
import { AdyenOrderService } from '../service/adyen-order.service';

describe('AdyenRedirectSuccessComponent', () => {
  let component: AdyenRedirectSuccessComponent;
  let fixture: ComponentFixture<AdyenRedirectSuccessComponent>;
  let mockRoutingService: jasmine.SpyObj<RoutingService>;
  let mockAdyenOrderService: jasmine.SpyObj<AdyenOrderService>;

  beforeEach(async () => {
    mockRoutingService = jasmine.createSpyObj('RoutingService', ['getParams', 'go']);
    mockAdyenOrderService = jasmine.createSpyObj('AdyenOrderService', ['loadOrderDetails', 'getOrderDetails']);

    // Ensure the mocked methods return Observables
    mockRoutingService.getParams.and.returnValue(of({ orderCode: '12345' }));
    mockAdyenOrderService.getOrderDetails.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      declarations: [AdyenRedirectSuccessComponent],
      providers: [
        { provide: RoutingService, useValue: mockRoutingService },
        { provide: AdyenOrderService, useValue: mockAdyenOrderService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdyenRedirectSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load order by code on init', () => {
    const orderCode = '12345';
    mockRoutingService.getParams.and.returnValue(of({ orderCode }));
    mockAdyenOrderService.getOrderDetails.and.returnValue(of({}));

    component.ngOnInit();

    expect(mockAdyenOrderService.loadOrderDetails).toHaveBeenCalledWith(orderCode);
  });

  it('should navigate to order confirmation if order details are available', () => {
    mockRoutingService.getParams.and.returnValue(of({ orderCode: '12345' }));
    mockAdyenOrderService.getOrderDetails.and.returnValue(of({}));

    component.ngOnInit();

    expect(mockRoutingService.go).toHaveBeenCalledWith({ cxRoute: 'orderConfirmation' });
  });

  it('should not navigate if order details are not available', () => {
    mockRoutingService.getParams.and.returnValue(of({ orderCode: '12345' }));
    mockAdyenOrderService.getOrderDetails.and.returnValue(of(undefined));

    component.ngOnInit();

    expect(mockRoutingService.go).not.toHaveBeenCalled();
  });
});
