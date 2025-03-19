import {Injectable} from '@angular/core';
import {
  Address,
  Command,
  CommandService,
  CommandStrategy,
  EventService,
  QueryNotifier,
  UserIdService,
} from '@spartacus/core';
import {AdyenBaseService} from "./adyen-base.service";
import {ActiveCartFacade, Cart, DeliveryMode, MultiCartFacade} from '@spartacus/cart/base/root';
import {filter, map, switchMap, take, tap} from 'rxjs/operators';
import {CheckoutDeliveryAddressConnector, CheckoutDeliveryModesConnector,} from '@spartacus/checkout/base/core';
import {
  CheckoutDeliveryAddressCreatedEvent,
  CheckoutDeliveryModeSetEvent,
  CheckoutSupportedDeliveryModesQueryReloadEvent,
  CheckoutSupportedDeliveryModesQueryResetEvent,
} from '@spartacus/checkout/base/root';


import {Observable} from 'rxjs';


@Injectable()
export class AdyenCartService extends AdyenBaseService{

  constructor(
    protected override activeCartFacade: ActiveCartFacade,
    protected override userIdService: UserIdService,
    protected commandService: CommandService,
    protected eventService: EventService,
    protected multiCartFacade: MultiCartFacade,
    protected checkoutDeliveryModesConnector: CheckoutDeliveryModesConnector,
    protected checkoutDeliveryAddressConnector: CheckoutDeliveryAddressConnector,
  ){
    super(userIdService, activeCartFacade)
  }

  /**
   * Returns the reload events for the supportedDeliveryModes query
   */
  protected getCheckoutSupportedDeliveryModesQueryReloadEvents(): QueryNotifier[] {
    return [CheckoutSupportedDeliveryModesQueryReloadEvent];
  }
  /**
   * Return the reset events for the supportedDeliveryModes query
   */
  protected getCheckoutSupportedDeliveryModesQueryResetEvents(): QueryNotifier[] {
    return [CheckoutSupportedDeliveryModesQueryResetEvent];
  }


  protected setDeliveryModeCommand: Command<{ deliveryModeCode: string, cartId: string }, unknown> =
    this.commandService.create<{ deliveryModeCode: string, cartId: string }>(
      ({deliveryModeCode, cartId}) =>
        super.checkoutPreconditions().pipe(
          switchMap(([userId]) =>
            this.checkoutDeliveryModesConnector
              .setMode(userId, cartId, deliveryModeCode)
              .pipe(
                tap(() => {
                  this.eventService.dispatch(
                    {userId, cartId, cartCode: cartId, deliveryModeCode},
                    CheckoutDeliveryModeSetEvent
                  );
                })
              )
          )
        ),
      {
        strategy: CommandStrategy.CancelPrevious,
      }
    );

  getSupportedDeliveryModesForCart(cartId: string): Observable<DeliveryMode[]> {
    return this.checkoutPreconditions().pipe(
      switchMap(([userId]) =>
        this.checkoutDeliveryModesConnector.getSupportedModes(
          userId,
          cartId
        )
      )
    )
  }

  protected createDeliveryAddressCommand: Command<{address: Address, cartId: string}, unknown> =
    this.commandService.create<{address: Address, cartId: string}>(
      ({address, cartId}) =>
        this.checkoutPreconditions().pipe(
          switchMap(([userId]) => {
            return this.checkoutDeliveryAddressConnector
              .createAddress(userId, cartId, address)
              .pipe(
                map((address) => {
                  if (address.region?.isocodeShort) {
                    address.region = {
                      ...address.region,
                      isocodeShort: address.region.isocodeShort,
                    };
                  }
                  return address;
                }),
                tap((address) =>
                  this.eventService.dispatch(
                    { userId, cartId, address },
                    CheckoutDeliveryAddressCreatedEvent
                  )
                )
              );
          })
        ),
      {
        strategy: CommandStrategy.CancelPrevious,
      }
    );

  setDeliveryMode(deliveryModeCode: string, cartId: string): Observable<unknown> {
    return this.setDeliveryModeCommand.execute({deliveryModeCode,cartId});
  }

  /**
   * Returns true when cart is stable (not loading and not pending processes on cart)
   */
  isStable(cart: Cart): Observable<boolean> {
    return this.multiCartFacade.isStable(cart.code || '');
  }

  /**
   * Waits for the cart to be stable before returning the active cart.
   */
  takeStable(cart: Observable<Cart>): Observable<Cart> {
    return cart.pipe(
      switchMap((cart) => this.isStable(cart).pipe(
        filter(isStable => isStable),
        map(() => cart)
      )),
      filter(cart => !!cart),
      take(1)
    );
  }

  createAndSetAddress(cartId: string, address: Address): Observable<unknown> {
    return this.createDeliveryAddressCommand.execute({address, cartId});
  }
}
