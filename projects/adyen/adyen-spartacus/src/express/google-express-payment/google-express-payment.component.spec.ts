import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleExpressPaymentComponent } from './google-express-payment.component';

describe('GoogleExpressPaymentComponent', () => {
  let component: GoogleExpressPaymentComponent;
  let fixture: ComponentFixture<GoogleExpressPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleExpressPaymentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GoogleExpressPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
