import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {CommandService, EventService, GlobalMessageService, TranslationService, UserIdService} from '@spartacus/core';
import {OrderConnector, OrderHistoryConnector} from '@spartacus/order/core';
import {Order} from '@spartacus/order/root';
import {ActiveCartFacade} from '@spartacus/cart/base/root';
import {AdyenOrderService} from './adyen-order.service';
import {AdyenExpressOrderService} from './adyen-express-order.service';
import {AdyenOrderConnector} from '../connectors/adyen-order-connector.service';
import {AdditionalDetailsConnector} from '../connectors/additional-details.connector';

describe('Adyen order services placed order sharing', () => {
  let orderService: AdyenOrderService;
  let expressOrderService: AdyenExpressOrderService;
  let orderHistoryConnector: jasmine.SpyObj<OrderHistoryConnector>;
  let userIdService: jasmine.SpyObj<UserIdService>;

  const read = (service: AdyenOrderService): Order | undefined => {
    let result: Order | undefined;
    service.getOrderDetails().subscribe(o => result = o).unsubscribe();
    return result;
  };

  beforeEach(() => {
    orderHistoryConnector = jasmine.createSpyObj('OrderHistoryConnector', ['get']);
    userIdService = jasmine.createSpyObj('UserIdService', ['takeUserId']);
    TestBed.configureTestingModule({
      providers: [
        AdyenOrderService,
        AdyenExpressOrderService,
        {provide: UserIdService, useValue: userIdService},
        {provide: CommandService, useValue: jasmine.createSpyObj('CommandService', ['create'])},
        {provide: GlobalMessageService, useValue: jasmine.createSpyObj('GlobalMessageService', ['add'])},
        {provide: TranslationService, useValue: jasmine.createSpyObj('TranslationService', ['translate'])},
        {provide: EventService, useValue: jasmine.createSpyObj('EventService', ['dispatch'])},
        {provide: OrderConnector, useValue: jasmine.createSpyObj('OrderConnector', [''])},
        {provide: OrderHistoryConnector, useValue: orderHistoryConnector},
        {provide: ActiveCartFacade, useValue: jasmine.createSpyObj('ActiveCartFacade', ['takeActiveCartId', 'isGuestCart'])},
        {provide: AdyenOrderConnector, useValue: jasmine.createSpyObj('AdyenOrderConnector', ['placeOrder'])},
        {provide: AdditionalDetailsConnector, useValue: jasmine.createSpyObj('AdditionalDetailsConnector', ['sendAdditionalDetails'])},
      ]
    });
    orderService = TestBed.inject(AdyenOrderService);
    expressOrderService = TestBed.inject(AdyenExpressOrderService);
  });

  it('should be two different instances', () => {
    expect(orderService).not.toBe(expressOrderService as AdyenOrderService);
  });

  it('should expose an order loaded by the express service through AdyenOrderService', () => {
    const order = {code: '0001'} as Order;
    userIdService.takeUserId.and.returnValue(of('current'));
    orderHistoryConnector.get.and.returnValue(of(order));

    expressOrderService.loadOrderDetails('0001');

    expect(read(orderService)).toBe(order);
    expect(read(expressOrderService)).toBe(order);
  });

  it('should expose an order loaded by AdyenOrderService through the express service', () => {
    const order = {code: '0002'} as Order;
    userIdService.takeUserId.and.returnValue(of('current'));
    orderHistoryConnector.get.and.returnValue(of(order));

    orderService.loadOrderDetails('0002');

    expect(read(expressOrderService)).toBe(order);
  });

  it('should share setPlacedOrder in both directions', () => {
    const a = {code: 'A'} as Order;
    const b = {code: 'B'} as Order;
    expressOrderService.setPlacedOrder(a);
    expect(read(orderService)).toBe(a);
    orderService.setPlacedOrder(b);
    expect(read(expressOrderService)).toBe(b);
  });

  it('should clear the placed order for both services', () => {
    expressOrderService.setPlacedOrder({code: 'C'} as Order);
    orderService.clearPlacedOrder();
    expect(read(orderService)).toBeUndefined();
    expect(read(expressOrderService)).toBeUndefined();

    orderService.setPlacedOrder({code: 'D'} as Order);
    expressOrderService.clearPlacedOrder();
    expect(read(orderService)).toBeUndefined();
  });
});
