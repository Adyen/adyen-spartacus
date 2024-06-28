import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckoutAdyenPaymentFormComponent } from './checkout-adyen-payment-form.component';

describe('CheckoutAdyenPaymentFormComponent', () => {
  let component: CheckoutAdyenPaymentFormComponent;
  let fixture: ComponentFixture<CheckoutAdyenPaymentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutAdyenPaymentFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CheckoutAdyenPaymentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
