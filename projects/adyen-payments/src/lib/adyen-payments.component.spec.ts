import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdyenPaymentsComponent } from './adyen-payments.component';

describe('AdyenPaymentsComponent', () => {
  let component: AdyenPaymentsComponent;
  let fixture: ComponentFixture<AdyenPaymentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdyenPaymentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdyenPaymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
