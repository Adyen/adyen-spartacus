import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {PLATFORM_ID} from '@angular/core';
import {GlobalMessageService, GlobalMessageType} from '@spartacus/core';
import {BehaviorSubject} from 'rxjs';
import {AdyenSubscriptionLinkService} from './adyen-subscription-link.service';

describe('AdyenSubscriptionLinkService', () => {
  let messages: BehaviorSubject<any>;
  const create = (platform: string) => {
    messages = new BehaviorSubject<any>({});
    TestBed.configureTestingModule({providers: [
      {provide: PLATFORM_ID, useValue: platform},
      {provide: GlobalMessageService, useValue: {get: () => messages.asObservable()}}
    ]});
    return TestBed.inject(AdyenSubscriptionLinkService);
  };
  const current = (service: AdyenSubscriptionLinkService): boolean => {
    let value = false;
    service.visible$.subscribe((v) => value = v).unsubscribe();
    return value;
  };

  it('is shown on show() and hidden on hide()', () => {
    const service = create('browser');
    expect(current(service)).toBeFalse();
    service.show(1000);
    expect(current(service)).toBeTrue();
    service.hide();
    expect(current(service)).toBeFalse();
  });

  it('hides itself after the timeout, and a second show() restarts it', fakeAsync(() => {
    const service = create('browser');
    service.show(1000);
    tick(600);
    service.show(1000);
    tick(600);
    expect(current(service)).toBeTrue();
    tick(400);
    expect(current(service)).toBeFalse();
  }));

  it('starts no timer on the server', fakeAsync(() => {
    const service = create('server');
    service.show(1000);
    expect(current(service)).toBeTrue();
    // fakeAsync fails on a pending timer
  }));

  it('hides when its message (by key) leaves the global messages, but not for other messages', () => {
    const service = create('browser');
    const mine = {key: 'a.b'};
    messages.next({[GlobalMessageType.MSG_TYPE_ERROR]: [mine]});
    service.show(1000, mine);
    expect(current(service)).toBeTrue();
    messages.next({[GlobalMessageType.MSG_TYPE_ERROR]: [mine, {key: 'other'}]});
    expect(current(service)).toBeTrue();
    messages.next({[GlobalMessageType.MSG_TYPE_ERROR]: [{key: 'other'}]});
    expect(current(service)).toBeFalse();
    service.hide();
  });

  it('matches a raw (already translated) message, in any message type', () => {
    const service = create('browser');
    messages.next({[GlobalMessageType.MSG_TYPE_WARNING]: [{raw: 'text'}]});
    service.show(1000, {raw: 'text'});
    expect(current(service)).toBeTrue();
    messages.next({});
    expect(current(service)).toBeFalse();
    service.hide();
  });

  it('hides at once when the message is not there, and ignores later re-appearance', fakeAsync(() => {
    const service = create('browser');
    service.show(1000, {key: 'gone'});
    expect(current(service)).toBeFalse();
    messages.next({[GlobalMessageType.MSG_TYPE_ERROR]: [{key: 'gone'}]});
    expect(current(service)).toBeFalse();
  }));

  it('stops watching the messages after hide() and on the server starts no timer when watching', fakeAsync(() => {
    const service = create('server');
    messages.next({[GlobalMessageType.MSG_TYPE_ERROR]: [{key: 'm'}]});
    service.show(1000, {key: 'm'});
    expect(messages.observed).toBeTrue();
    service.hide();
    expect(messages.observed).toBeFalse();
  }));

  it('exposes visible$ as one stable observable', () => {
    const service = create('browser');
    expect(service.visible$).toBe(service.visible$);
  });
});
