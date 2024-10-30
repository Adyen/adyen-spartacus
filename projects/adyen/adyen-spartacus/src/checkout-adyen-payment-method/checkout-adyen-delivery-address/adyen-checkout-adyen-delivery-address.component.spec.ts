import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdyenCheckoutAdyenDeliveryAddressComponent } from './adyen-checkout-adyen-delivery-address.component';
import { UserAddressService, TranslationService, GlobalMessageService, Address } from '@spartacus/core';
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { CheckoutDeliveryAddressFacade } from '@spartacus/checkout/base/root';
import { CheckoutStepService } from '@spartacus/checkout/base/components';
import { AdyenAddressService } from '../../service/adyen-address.service';
import { of, BehaviorSubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cxTranslate' })
class MockCxTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('AdyenCheckoutAdyenDeliveryAddressComponent', () => {
  let component: AdyenCheckoutAdyenDeliveryAddressComponent;
  let fixture: ComponentFixture<AdyenCheckoutAdyenDeliveryAddressComponent>;
  let mockUserAddressService: any;
  let mockCheckoutDeliveryAddressFacade: any;
  let mockActiveCartFacade: any;
  let mockTranslationService: any;
  let mockGlobalMessageService: any;
  let mockAdyenAddressService: any;
  let mockCheckoutStepService: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockUserAddressService = jasmine.createSpyObj('UserAddressService', ['loadAddresses', 'getAddresses', 'getAddressesLoading']);
    mockUserAddressService.getAddressesLoading.and.returnValue(of(false));
    mockCheckoutDeliveryAddressFacade = jasmine.createSpyObj('CheckoutDeliveryAddressFacade', ['getDeliveryAddressState']);
    mockCheckoutDeliveryAddressFacade.getDeliveryAddressState.and.returnValue(of({ loading: false }));
    mockActiveCartFacade = jasmine.createSpyObj('ActiveCartFacade', ['isGuestCart']);
    mockActiveCartFacade.isGuestCart.and.returnValue(of(true));
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockGlobalMessageService = jasmine.createSpyObj('GlobalMessageService', ['add']);
    mockAdyenAddressService = jasmine.createSpyObj('AdyenAddressService', ['adyenAddUserAddress']);
    mockCheckoutStepService = jasmine.createSpyObj('CheckoutStepService', ['next']);
    mockActivatedRoute = { snapshot: { queryParamMap: { get: jasmine.createSpy().and.returnValue('sessionId') } } };

    await TestBed.configureTestingModule({
      declarations: [AdyenCheckoutAdyenDeliveryAddressComponent,MockCxTranslatePipe],
      providers: [
        { provide: UserAddressService, useValue: mockUserAddressService },
        { provide: CheckoutDeliveryAddressFacade, useValue: mockCheckoutDeliveryAddressFacade },
        { provide: ActiveCartFacade, useValue: mockActiveCartFacade },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: GlobalMessageService, useValue: mockGlobalMessageService },
        { provide: AdyenAddressService, useValue: mockAdyenAddressService },
        { provide: CheckoutStepService, useValue: mockCheckoutStepService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdyenCheckoutAdyenDeliveryAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize component properties correctly', () => {
    expect(component.sameAsDeliveryAddress).toBeTrue();
    expect(component.selectedAddress$).toBeDefined();
  });

  it('should set selected address correctly in selectAddress', () => {
    const address: Address = { id: 'test' } as Address;
    component.selectAddress(address);
    expect(component.selectedAddress$.getValue()).toEqual(address);
  });

  it('should add a new address and update state correctly in addAddress', () => {
    const address: Address = { id: 'test' } as Address;
    mockAdyenAddressService.adyenAddUserAddress.and.returnValue(of(address));
    spyOn(component.setBillingAddress, 'emit');
    component.addAddress(address);
    expect(mockAdyenAddressService.adyenAddUserAddress).toHaveBeenCalledWith(address);
    expect(component.setBillingAddress.emit).toHaveBeenCalledWith(address);
    expect(component.selectedAddress$.getValue()).toEqual(address);
  });

  it('should toggle sameAsDeliveryAddress correctly', () => {
    component.sameAsDeliveryAddress = true;
    component.toggleSameAsDeliveryAddress();
    expect(component.sameAsDeliveryAddress).toBeFalse();
    component.toggleSameAsDeliveryAddress();
    expect(component.sameAsDeliveryAddress).toBeTrue();
  });
});
