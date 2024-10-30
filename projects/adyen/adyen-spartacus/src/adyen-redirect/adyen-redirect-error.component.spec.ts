import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdyenRedirectErrorComponent } from './adyen-redirect-error.component';
import { RoutingService, GlobalMessageService, GlobalMessageType, OCC_CART_ID_CURRENT, TranslationService, UserIdService } from '@spartacus/core';
import { MultiCartFacade } from '@spartacus/cart/base/root';

describe('AdyenRedirectErrorComponent', () => {
  let component: AdyenRedirectErrorComponent;
  let fixture: ComponentFixture<AdyenRedirectErrorComponent>;
  let mockRoutingService: jasmine.SpyObj<RoutingService>;
  let mockGlobalMessageService: jasmine.SpyObj<GlobalMessageService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockUserIdService: jasmine.SpyObj<UserIdService>;
  let mockMultiCartFacade: jasmine.SpyObj<MultiCartFacade>;

  beforeEach(async () => {
    mockRoutingService = jasmine.createSpyObj('RoutingService', ['getParams', 'go']);
    mockGlobalMessageService = jasmine.createSpyObj('GlobalMessageService', ['add']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockUserIdService = jasmine.createSpyObj('UserIdService', ['takeUserId']);
    mockMultiCartFacade = jasmine.createSpyObj('MultiCartFacade', ['reloadCart', 'loadCart', 'getCartIdByType']);

    mockRoutingService.getParams.and.returnValue(of({ errorCode: btoa('someErrorCode') }));
    mockTranslationService.translate.and.returnValue(of('translatedMessage'));
    mockUserIdService.takeUserId.and.returnValue(of('userId'));
    mockMultiCartFacade.getCartIdByType.and.returnValue(of('cartId'));

    await TestBed.configureTestingModule({
      declarations: [AdyenRedirectErrorComponent],
      providers: [
        { provide: RoutingService, useValue: mockRoutingService },
        { provide: GlobalMessageService, useValue: mockGlobalMessageService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: UserIdService, useValue: mockUserIdService },
        { provide: MultiCartFacade, useValue: mockMultiCartFacade }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdyenRedirectErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add error message and reload cart on init', () => {
    const errorCode = 'someErrorCode';
    const translatedMessage = 'translatedMessage';
    const userId = 'userId';
    const cartId = 'cartId';

    mockRoutingService.getParams.and.returnValue(of({ errorCode: btoa(errorCode) }));
    mockTranslationService.translate.and.returnValue(of(translatedMessage));
    mockUserIdService.takeUserId.and.returnValue(of(userId));
    mockMultiCartFacade.getCartIdByType.and.returnValue(of(cartId));

    component.ngOnInit();

    expect(mockTranslationService.translate).toHaveBeenCalledWith(component['placeOrderErrorCodePrefix'] + errorCode);
    expect(mockGlobalMessageService.add).toHaveBeenCalledWith(translatedMessage, GlobalMessageType.MSG_TYPE_ERROR, component['messageTimeout']);
    expect(mockMultiCartFacade.reloadCart).toHaveBeenCalledWith(OCC_CART_ID_CURRENT);
    expect(mockMultiCartFacade.loadCart).toHaveBeenCalledWith({ cartId: OCC_CART_ID_CURRENT, userId });
    expect(mockRoutingService.go).toHaveBeenCalledWith({ cxRoute: 'checkoutAdyenPaymentDetails' });
  });

  it('should unsubscribe from all subscriptions on destroy', () => {
    spyOn(component['subscriptions'], 'unsubscribe');
    component.ngOnDestroy();
    expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
  });
});
