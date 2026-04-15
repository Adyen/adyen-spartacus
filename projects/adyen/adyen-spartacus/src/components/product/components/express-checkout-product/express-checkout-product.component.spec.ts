import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpressCheckoutProductComponent } from './express-checkout-product.component';

describe('ExpressCheckoutProductComponent', () => {
  let component: ExpressCheckoutProductComponent;
  let fixture: ComponentFixture<ExpressCheckoutProductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpressCheckoutProductComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExpressCheckoutProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
