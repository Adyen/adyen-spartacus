import { TestBed } from '@angular/core/testing';
import { CheckoutAdyenEventListener } from './checkout-adyen-event.listener';
import { EventService, LanguageSetEvent, CurrencySetEvent } from '@spartacus/core';
import { CheckoutAdyenConfigurationReloadEvent } from './checkout-adyen.events';
import { of } from 'rxjs';

describe('CheckoutAdyenEventListener', () => {
  let eventListener: CheckoutAdyenEventListener;
  let eventService: jasmine.SpyObj<EventService>;

  beforeEach(() => {
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['get', 'dispatch']);

    TestBed.configureTestingModule({
      providers: [
        CheckoutAdyenEventListener,
        { provide: EventService, useValue: eventServiceSpy }
      ]
    });

    eventListener = TestBed.inject(CheckoutAdyenEventListener);
    eventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
  });

  it('should be created', () => {
    expect(eventListener).toBeTruthy();
  });

  it('should subscribe to LanguageSetEvent and CurrencySetEvent and dispatch CheckoutAdyenConfigurationReloadEvent', () => {
    eventService.get.withArgs(LanguageSetEvent).and.callFake(() => of(new LanguageSetEvent()) as any);
    eventService.get.withArgs(CurrencySetEvent).and.callFake(() => of(new CurrencySetEvent()) as any);
    eventListener['onCheckoutAdyenConfigurationReload']();

    expect(eventService.get).toHaveBeenCalledWith(LanguageSetEvent);
    expect(eventService.get).toHaveBeenCalledWith(CurrencySetEvent);
    expect(eventService.dispatch).toHaveBeenCalledWith(jasmine.any(CheckoutAdyenConfigurationReloadEvent));
  });

  it('should unsubscribe on destroy', () => {
    spyOn(eventListener['subscriptions'], 'unsubscribe');

    eventListener.ngOnDestroy();

    expect(eventListener['subscriptions'].unsubscribe).toHaveBeenCalled();
  });
});
