import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckoutAdyenPaymentMethodComponent } from './checkout-adyen-payment-method.component';

describe('CheckoutAdyenPaymentMethodComponent', () => {
  let component: CheckoutAdyenPaymentMethodComponent;
  let fixture: ComponentFixture<CheckoutAdyenPaymentMethodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutAdyenPaymentMethodComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CheckoutAdyenPaymentMethodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
