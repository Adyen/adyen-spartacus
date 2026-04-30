import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpressCheckoutCartComponent } from './express-checkout-cart.component';

describe('ExpressCheckoutCartComponent', () => {
  let component: ExpressCheckoutCartComponent;
  let fixture: ComponentFixture<ExpressCheckoutCartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpressCheckoutCartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExpressCheckoutCartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
