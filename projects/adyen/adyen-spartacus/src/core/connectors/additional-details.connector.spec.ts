import { TestBed } from '@angular/core/testing';
import { AdditionalDetailsConnector } from './additional-details.connector';
import { OccAdditionalDetailsAdapter } from '../occ/adapters/occ-additionaldetails.adapter';
import { of } from 'rxjs';
import { PlaceOrderRequest, PlaceOrderResponse } from '../models/occ.order.models';

describe('AdditionalDetailsConnector', () => {
  let connector: AdditionalDetailsConnector;
  let adapter: jasmine.SpyObj<OccAdditionalDetailsAdapter>;

  beforeEach(() => {
    const adapterSpy = jasmine.createSpyObj('OccAdditionalDetailsAdapter', ['sendAdditionalDetails']);

    TestBed.configureTestingModule({
      providers: [
        AdditionalDetailsConnector,
        { provide: OccAdditionalDetailsAdapter, useValue: adapterSpy }
      ]
    });

    connector = TestBed.inject(AdditionalDetailsConnector);
    adapter = TestBed.inject(OccAdditionalDetailsAdapter) as jasmine.SpyObj<OccAdditionalDetailsAdapter>;
  });

  it('should be created', () => {
    expect(connector).toBeTruthy();
  });

  it('should call sendAdditionalDetails on the adapter', () => {
    const userId = 'testUser';
    const cartId = 'testCart';
    const orderData: PlaceOrderRequest = {
      paymentRequest: {}
    };
    const response: PlaceOrderResponse = {
      success: true,
      executeAction: false,
      paymentsAction: undefined,
      error: undefined,
      errorFieldCodes: [],
      orderNumber: '12345',
      orderData: {}
    };

    adapter.sendAdditionalDetails.and.returnValue(of(response));

    connector.sendAdditionalDetails(userId, orderData).subscribe(result => {
      expect(result).toEqual(response);
    });

    expect(adapter.sendAdditionalDetails).toHaveBeenCalledWith(userId, orderData);
  });
});
