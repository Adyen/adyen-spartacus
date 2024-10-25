import { TestBed } from '@angular/core/testing';
import { of, Observable } from 'rxjs';
import { AdyenAddressService } from './adyen-address.service';
import { UserAddressConnector, UserIdService, CommandService, Address } from '@spartacus/core';
import { ActiveCartFacade } from '@spartacus/cart/base/root';

describe('AdyenAddressService', () => {
  let service: AdyenAddressService;
  let userAddressConnector: jasmine.SpyObj<UserAddressConnector>;
  let userIdService: jasmine.SpyObj<UserIdService>;
  let commandService: jasmine.SpyObj<CommandService>;
  let activeCartFacade: jasmine.SpyObj<ActiveCartFacade>;

  beforeEach(() => {
    const userAddressConnectorSpy = jasmine.createSpyObj('UserAddressConnector', ['add']);
    const userIdServiceSpy = jasmine.createSpyObj('UserIdService', ['getUserId']);
    const commandServiceSpy = jasmine.createSpyObj('CommandService', ['create']);
    const activeCartFacadeSpy = jasmine.createSpyObj('ActiveCartFacade', ['getActiveCartId']);

    TestBed.configureTestingModule({
      providers: [
        AdyenAddressService,
        { provide: UserAddressConnector, useValue: userAddressConnectorSpy },
        { provide: UserIdService, useValue: userIdServiceSpy },
        { provide: CommandService, useValue: commandServiceSpy },
        { provide: ActiveCartFacade, useValue: activeCartFacadeSpy }
      ]
    });

    service = TestBed.inject(AdyenAddressService);
    userAddressConnector = TestBed.inject(UserAddressConnector) as jasmine.SpyObj<UserAddressConnector>;
    userIdService = TestBed.inject(UserIdService) as jasmine.SpyObj<UserIdService>;
    commandService = TestBed.inject(CommandService) as jasmine.SpyObj<CommandService>;
    activeCartFacade = TestBed.inject(ActiveCartFacade) as jasmine.SpyObj<ActiveCartFacade>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

/*  it('should add user address', (done: DoneFn) => {
    const mockUserId = 'testUser';
    const mockAddress: Address = { id: 'testAddress' } as Address;
    const mockResponse: Address = { id: 'responseAddress' } as Address;

    userIdService.getUserId.and.returnValue(of(mockUserId));
    userAddressConnector.add.and.returnValue(of(mockResponse));
    commandService.create.and.callFake((fn: (address: Address) => Observable<Address>) => {
      return {
        execute: (billingAddress: Address) => fn(billingAddress)
      };
    });

    service.adyenAddUserAddress(mockAddress).subscribe((response) => {
      expect(response).toBe(mockResponse);
      done();
    });

    expect(userIdService.getUserId).toHaveBeenCalled();
    expect(userAddressConnector.add).toHaveBeenCalledWith(mockUserId, mockAddress);
  });*/
});
