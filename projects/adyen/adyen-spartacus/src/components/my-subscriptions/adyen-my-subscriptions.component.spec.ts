import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { GlobalMessageService, GlobalMessageType, TranslationService } from '@spartacus/core';
import { of, Subject, throwError } from 'rxjs';
import { AdyenMySubscriptionsComponent } from './adyen-my-subscriptions.component';
import { AdyenSubscriptionsService } from '../../core/services/adyen-subscriptions.service';
import { AdyenLoggerService } from '../../core/services/adyen-logger.service';
import {
  AdyenSubscriptionEntry,
  AdyenSubscriptionOverview,
  AdyenSubscriptionSection
} from '../../core/models/occ.subscriptions.models';

@Pipe({ name: 'cxTranslate', standalone: false })
class MockCxTranslatePipe implements PipeTransform {
  transform(value: string, params?: object): string {
    return params ? `${value} ${JSON.stringify(params)}` : value;
  }
}

@Pipe({ name: 'cxUrl', standalone: false })
class MockCxUrlPipe implements PipeTransform {
  transform(value: any): string {
    return '/my-account/order/' + value?.params?.code;
  }
}

const opt = (id: string, current = false) => ({ id, displayLabel: 'label ' + id, current });

function entry(over: Partial<AdyenSubscriptionEntry> = {}): AdyenSubscriptionEntry {
  return {
    code: 'S-1', productName: 'Coffee box', state: 'ACTIVE', tone: 'normal', effectiveDate: '2026-12-01T00:00:00Z',
    quantity: 1, orderCode: '0001', orderDate: '2026-10-01T00:00:00Z', paymentMethodSummary: 'Visa 4242',
    manageable: true, cancellable: false, paymentMethodChangeable: false, paymentMethodControl: false,
    paymentMethodShareable: false, paymentMethodChangeCovered: false,
    paymentMethodOptions: [], adyenVaultOptions: [], ...over
  };
}

function section(over: Partial<AdyenSubscriptionSection> = {}): AdyenSubscriptionSection {
  return {
    platformCode: 'RECURLY', platformName: 'Recurly', subscriptions: [entry()], ordersAwaitingSetup: [],
    paymentMethodChangeOffers: [], paymentMethodEnrollmentOffers: [], paymentMethodChangeSupported: true,
    paymentMethodChangeOffered: false, rowPaymentMethodControlOffered: false, ...over
  };
}

describe('AdyenMySubscriptionsComponent', () => {
  let fixture: ComponentFixture<AdyenMySubscriptionsComponent>;
  let component: AdyenMySubscriptionsComponent;
  let service: jasmine.SpyObj<AdyenSubscriptionsService>;
  let messages: jasmine.SpyObj<GlobalMessageService>;
  let navigated: string[];

  const el = (): HTMLElement => fixture.nativeElement;
  const q = (s: string) => el().querySelector(s) as HTMLElement | null;
  const qa = (s: string) => Array.from(el().querySelectorAll(s)) as HTMLElement[];

  function create(overview: AdyenSubscriptionOverview | HttpErrorResponse = { sections: [section()] }) {
    service.getSubscriptions.and.returnValue(overview instanceof HttpErrorResponse ? throwError(() => overview) : of(overview));
    fixture = TestBed.createComponent(AdyenMySubscriptionsComponent);
    component = fixture.componentInstance;
    navigated = [];
    (component as any).navigate = (url: string) => navigated.push(url);
    fixture.detectChanges();
  }

  beforeEach(() => {
    service = jasmine.createSpyObj('AdyenSubscriptionsService',
      ['getSubscriptions', 'cancelSubscription', 'changePaymentMethod', 'getEnrollmentUrl']);
    messages = jasmine.createSpyObj('GlobalMessageService', ['add']);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AdyenMySubscriptionsComponent, MockCxTranslatePipe, MockCxUrlPipe],
      providers: [
        { provide: AdyenSubscriptionsService, useValue: service },
        { provide: GlobalMessageService, useValue: messages },
        { provide: TranslationService, useValue: { translate: (k: string, p?: object) => of(p ? `${k} ${JSON.stringify(p)}` : k) } },
        { provide: AdyenLoggerService, useValue: jasmine.createSpyObj('AdyenLoggerService', ['error', 'warn', 'log']) }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
  });

  describe('rendering', () => {
    it('shows the platform name, product, order link and paid-with; quantity only above 1', () => {
      create({ sections: [section({ subscriptions: [entry({ quantity: 3 }), entry({ code: 'S-2', quantity: 1 })] })] });
      expect(q('.cx-adyen-subs__section-title')!.textContent).toContain('Recurly');
      expect(qa('.cx-adyen-subs__name')[0].textContent).toContain('Coffee box');
      expect(qa('.cx-adyen-subs__qty').length).toBe(1);
      expect(qa('.cx-adyen-subs__qty')[0].textContent).toContain('3');
      expect(q('.cx-adyen-subs__order-link')!.getAttribute('href')).toBe('/my-account/order/0001');
      expect(q('.cx-adyen-subs__meta')!.textContent).toContain('adyenMySubscriptions.paidWith');
      expect(q('.cx-adyen-subs__meta')!.textContent).toContain('Visa 4242');
    });

    it('uses the dated state text only when an effective date exists and carries the tone class', () => {
      create({ sections: [section({ subscriptions: [
        entry({ state: 'PAST_DUE_ENDING', tone: 'attention', effectiveDate: '2026-12-01T00:00:00Z' }),
        entry({ code: 'S-2', state: 'ENDED', tone: 'quiet', effectiveDate: null })] })] });
      const states = qa('.cx-adyen-subs__state');
      expect(states[0].textContent).toContain('adyenMySubscriptions.statePastDueEndingDated');
      expect(states[1].textContent).toContain('adyenMySubscriptions.stateEnded');
      expect(states[1].textContent).not.toContain('stateEndedDated');
      const rows = qa('.cx-adyen-subs__row');
      expect(rows[0].classList).toContain('cx-adyen-subs__row--attention');
      expect(rows[1].classList).toContain('cx-adyen-subs__row--quiet');
    });

    it('falls back to the unavailable text for an unknown state', () => {
      create({ sections: [section({ subscriptions: [entry({ state: 'WEIRD' as any, effectiveDate: null })] })] });
      expect(q('.cx-adyen-subs__state')!.textContent).toContain('adyenMySubscriptions.stateUnavailable');
    });

    it('lists orders awaiting setup in a banner', () => {
      create({ sections: [section({ ordersAwaitingSetup: ['0042', '0043'] })] });
      expect(qa('.cx-adyen-subs__notice li').length).toBe(2);
      expect(q('.cx-adyen-subs__notice')!.textContent).toContain('0042');
    });

    it('shows the empty state for no sections and for a 404, without a message', () => {
      create({ sections: [] });
      expect(q('.cx-adyen-subs__empty')!.textContent).toContain('adyenMySubscriptions.empty');
      create(new HttpErrorResponse({ status: 404 }));
      expect(q('.cx-adyen-subs__empty')!.textContent).toContain('adyenMySubscriptions.empty');
      expect(q('.text-danger')).toBeNull();
      expect(messages.add).not.toHaveBeenCalled();
    });

    it('shows a load error for other failures', () => {
      create(new HttpErrorResponse({ status: 500 }));
      expect(q('.text-danger')!.textContent).toContain('adyenMySubscriptions.loadError');
    });

    it('says the provider cannot change cards only when unsupported and there are subscriptions', () => {
      create({ sections: [section({ paymentMethodChangeSupported: false })] });
      expect(q('.cx-adyen-subs__note--standalone')).not.toBeNull();
      create({ sections: [section({ paymentMethodChangeSupported: true })] });
      expect(q('.cx-adyen-subs__note--standalone')).toBeNull();
    });
  });

  describe('action visibility', () => {
    it('offers cancel only when cancellable', () => {
      create({ sections: [section({ subscriptions: [entry({ cancellable: false })] })] });
      expect(q('.cx-adyen-subs__btn--quiet')).toBeNull();
      create({ sections: [section({ subscriptions: [entry({ cancellable: true })] })] });
      expect(q('.cx-adyen-subs__btn--quiet')).not.toBeNull();
    });

    const rowSection = (sec: Partial<AdyenSubscriptionSection>, ent: Partial<AdyenSubscriptionEntry>) =>
      ({ sections: [section({ subscriptions: [entry({
        paymentMethodChangeable: true, paymentMethodControl: true, paymentMethodChangeCovered: true,
        paymentMethodOptions: [opt('a', true), opt('b')], ...ent })], ...sec })] });

    it('shows the row control only when offered by the section, controlled and changeable', () => {
      create(rowSection({ rowPaymentMethodControlOffered: true }, {}));
      expect(q('details.cx-adyen-subs__disclosure select')).not.toBeNull();
      create(rowSection({ rowPaymentMethodControlOffered: false }, {}));
      expect(q('details.cx-adyen-subs__disclosure')).toBeNull();
      create(rowSection({ rowPaymentMethodControlOffered: true }, { paymentMethodControl: false }));
      expect(q('details.cx-adyen-subs__disclosure')).toBeNull();
      create(rowSection({ rowPaymentMethodControlOffered: true }, { paymentMethodChangeable: false }));
      expect(q('details.cx-adyen-subs__disclosure')).toBeNull();
    });

    it('shows applyToAll only when shareable', () => {
      create(rowSection({ rowPaymentMethodControlOffered: true }, { paymentMethodShareable: false }));
      expect(q('.cx-adyen-subs__check')).toBeNull();
      create(rowSection({ rowPaymentMethodControlOffered: true }, { paymentMethodShareable: true }));
      expect(q('.cx-adyen-subs__check input[type=checkbox]')).not.toBeNull();
    });

    it('groups the options only when both sources are present and marks the current one', () => {
      create(rowSection({ rowPaymentMethodControlOffered: true }, { adyenVaultOptions: [opt('v1')] }));
      expect(qa('optgroup').length).toBe(2);
      expect(qa('option').length).toBe(3);
      expect(qa('option')[0].textContent).toContain('adyenMySubscriptions.paymentMethodCurrent');
      create(rowSection({ rowPaymentMethodControlOffered: true }, {}));
      expect(qa('optgroup').length).toBe(0);
    });

    it('says a row cannot be changed where the section offers changes but nothing covers it', () => {
      create({ sections: [section({ paymentMethodChangeOffered: true, subscriptions: [
        entry({ paymentMethodChangeable: true, paymentMethodChangeCovered: false })] })] });
      expect(el().textContent).toContain('adyenMySubscriptions.paymentMethodRowUnavailable');
    });

    it('renders account-wide offers and names the account only with several accounts', () => {
      const offer = (code: string, name: string) => ({ subscriptionCode: code, accountName: name,
        paymentMethodOptions: [opt('a', true)], adyenVaultOptions: [] });
      create({ sections: [section({ paymentMethodChangeOffers: [offer('S-1', 'Shop A')] })] });
      expect(qa('[data-test^=account-change]').length).toBe(1);
      expect(el().textContent).not.toContain('paymentMethodAccount');
      create({ sections: [section({ paymentMethodChangeOffers: [offer('S-1', 'Shop A'), offer('S-9', 'Shop B')] })] });
      expect(qa('[data-test^=account-change]').length).toBe(2);
      expect(el().textContent).toContain('paymentMethodAccount');
    });

    it('shows the enrollment notice by type', () => {
      create({ sections: [section({ paymentMethodEnrollmentOffers: [
        { subscriptionCode: 'S-1', notice: 'REPLACES_METHOD_ON_FILE' }] })] });
      expect(q('[data-test^=enrollment]')!.textContent).toContain('paymentMethodAddEffectReplacesMethodOnFile');
      create({ sections: [section({ paymentMethodEnrollmentOffers: [
        { subscriptionCode: 'S-1', notice: 'ADDS_METHOD' }] })] });
      expect(q('[data-test^=enrollment]')!.textContent).toContain('paymentMethodAddEffectAddsMethod');
    });
  });

  describe('cancel', () => {
    const cancellable = { sections: [section({ subscriptions: [entry({ cancellable: true })] })] };

    it('asks for confirmation stating the date and no refund before calling the backend', () => {
      create(cancellable);
      (q('.cx-adyen-subs__btn--quiet') as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(service.cancelSubscription).not.toHaveBeenCalled();
      expect(q('.cx-adyen-subs__confirm')!.textContent).toContain('adyenMySubscriptions.cancelNote');
      expect(q('.cx-adyen-subs__confirm')!.textContent).toContain('adyenMySubscriptions.cancelAccessUntil');
    });

    it('cancels once, disables actions in flight, reports success and reloads', () => {
      create(cancellable);
      const inFlight = new Subject<Object>();
      service.cancelSubscription.and.returnValue(inFlight);
      const sec = component.sections$.value[0];
      component.askCancel(sec, sec.subscriptions![0]);
      component.cancel(sec, sec.subscriptions![0]);
      component.cancel(sec, sec.subscriptions![0]);
      expect(service.cancelSubscription).toHaveBeenCalledTimes(1);
      expect(service.cancelSubscription).toHaveBeenCalledWith('S-1', 'RECURLY');
      expect(component.busy$.value).toBeTrue();
      inFlight.next({});
      inFlight.complete();
      expect(component.busy$.value).toBeFalse();
      expect(messages.add).toHaveBeenCalledWith('adyenMySubscriptions.cancelSuccess', GlobalMessageType.MSG_TYPE_CONFIRMATION);
      expect(service.getSubscriptions).toHaveBeenCalledTimes(2);
    });

    it('reports a refusal (HTTP 400) as an error and reloads', () => {
      create(cancellable);
      service.cancelSubscription.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
      const sec = component.sections$.value[0];
      component.cancel(sec, sec.subscriptions![0]);
      expect(messages.add).toHaveBeenCalledWith('adyenMySubscriptions.cancelError', GlobalMessageType.MSG_TYPE_ERROR);
      expect(service.getSubscriptions).toHaveBeenCalledTimes(2);
      expect(component.busy$.value).toBeFalse();
    });
  });

  describe('payment-method change', () => {
    const withRow = (ent: Partial<AdyenSubscriptionEntry> = {}) => ({ sections: [section({
      rowPaymentMethodControlOffered: true, subscriptions: [entry({
        paymentMethodChangeable: true, paymentMethodControl: true, paymentMethodChangeCovered: true,
        paymentMethodShareable: true, paymentMethodOptions: [opt('a', true), opt('b')], adyenVaultOptions: [opt('v1')],
        ...ent })] })] });

    function submit(result: any) {
      service.changePaymentMethod.and.returnValue(of(result));
      const sec = component.sections$.value[0];
      component.changeEntry(sec, sec.subscriptions![0]);
    }

    it('sends the current option by default, then the picked one with applyToAll', () => {
      create(withRow());
      submit({ result: 'CHANGED_THIS_SUBSCRIPTION', moved: 1, failed: 0, partial: false });
      expect(service.changePaymentMethod).toHaveBeenCalledWith('S-1', 'RECURLY', 'a', false);

      const sec = component.sections$.value[0];
      const key = component.rowKey(sec, sec.subscriptions![0]);
      component.selectMethod(key, 'v1');
      component.setApplyToAll(key, true);
      submit({ result: 'CHANGED_ALL_SUBSCRIPTIONS', moved: 1, failed: 0, partial: false });
      expect(service.changePaymentMethod).toHaveBeenCalledWith('S-1', 'RECURLY', 'v1', true);
    });

    it('ignores applyToAll when the row is not shareable', () => {
      create(withRow({ paymentMethodShareable: false }));
      const sec = component.sections$.value[0];
      component.setApplyToAll(component.rowKey(sec, sec.subscriptions![0]), true);
      submit({ result: 'CHANGED_THIS_SUBSCRIPTION', moved: 1, failed: 0, partial: false });
      expect(service.changePaymentMethod).toHaveBeenCalledWith('S-1', 'RECURLY', 'a', false);
    });

    it('reports a partial result as an error with the counts, even when something moved', () => {
      create(withRow());
      submit({ result: 'CHANGED_ALL_SUBSCRIPTIONS', moved: 2, failed: 1, partial: true });
      expect(messages.add).toHaveBeenCalledWith(
        'adyenMySubscriptions.paymentMethodSuccessSome {"moved":2,"failed":1}', GlobalMessageType.MSG_TYPE_ERROR);
    });

    it('reports CHANGED_ALL with more than one moved as counted', () => {
      create(withRow());
      submit({ result: 'CHANGED_ALL_SUBSCRIPTIONS', moved: 3, failed: 0, partial: false });
      expect(messages.add).toHaveBeenCalledWith(
        'adyenMySubscriptions.paymentMethodSuccessCounted {"count":3}', GlobalMessageType.MSG_TYPE_CONFIRMATION);
    });

    it('reports CHANGED_ALL with one moved as the customer message', () => {
      create(withRow());
      submit({ result: 'CHANGED_ALL_SUBSCRIPTIONS', moved: 1, failed: 0, partial: false });
      expect(messages.add).toHaveBeenCalledWith(
        'adyenMySubscriptions.paymentMethodSuccessCustomer', GlobalMessageType.MSG_TYPE_CONFIRMATION);
    });

    it('reports a single change as confirmation', () => {
      create(withRow());
      submit({ result: 'CHANGED_THIS_SUBSCRIPTION', moved: 1, failed: 0, partial: false });
      expect(messages.add).toHaveBeenCalledWith(
        'adyenMySubscriptions.paymentMethodSuccessSubscription', GlobalMessageType.MSG_TYPE_CONFIRMATION);
    });

    it('reports NOT_SUPPORTED_HERE as info', () => {
      create(withRow());
      submit({ result: 'NOT_SUPPORTED_HERE', moved: 0, failed: 0, partial: false });
      expect(messages.add).toHaveBeenCalledWith(
        'adyenMySubscriptions.paymentMethodUnsupported', GlobalMessageType.MSG_TYPE_INFO);
    });

    it('reports FAILED as an error', () => {
      create(withRow());
      submit({ result: 'FAILED', moved: 0, failed: 1, partial: false });
      expect(messages.add).toHaveBeenCalledWith(
        'adyenMySubscriptions.paymentMethodError', GlobalMessageType.MSG_TYPE_ERROR);
    });

    it('reports HTTP 400 as an error and reloads the list after every outcome', () => {
      create(withRow());
      service.changePaymentMethod.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
      const sec = component.sections$.value[0];
      component.changeEntry(sec, sec.subscriptions![0]);
      expect(messages.add).toHaveBeenCalledWith(
        'adyenMySubscriptions.paymentMethodError', GlobalMessageType.MSG_TYPE_ERROR);
      expect(service.getSubscriptions).toHaveBeenCalledTimes(2);
    });

    it('does not submit twice while in flight', () => {
      create(withRow());
      service.changePaymentMethod.and.returnValue(new Subject<any>());
      const sec = component.sections$.value[0];
      component.changeEntry(sec, sec.subscriptions![0]);
      component.changeEntry(sec, sec.subscriptions![0]);
      expect(service.changePaymentMethod).toHaveBeenCalledTimes(1);
    });
  });

  describe('robustness', () => {
    it('renders rows without a code and without array fields, with distinct row keys', () => {
      const noCode = (): AdyenSubscriptionEntry => {
        const e: any = entry({ state: 'SETTING_UP', effectiveDate: null });
        delete e.code; delete e.paymentMethodOptions; delete e.adyenVaultOptions;
        return e;
      };
      const sec: any = section({ subscriptions: [noCode(), noCode()] });
      delete sec.ordersAwaitingSetup; delete sec.paymentMethodChangeOffers; delete sec.paymentMethodEnrollmentOffers;
      create({ sections: [sec] });
      expect(qa('.cx-adyen-subs__row').length).toBe(2);
      const s0 = component.sections$.value[0];
      expect(component.rowKey(s0, s0.subscriptions![0], 0)).not.toBe(component.rowKey(s0, s0.subscriptions![1], 1));
      expect(component.selectedId('k', undefined, undefined)).toBe('');
    });
  });

  describe('enrollment', () => {
    it('refuses non-https urls without navigating', () => {
      create({ sections: [section({ paymentMethodEnrollmentOffers: [{ subscriptionCode: 'S-1', notice: 'ADDS_METHOD' }] })] });
      const sec = component.sections$.value[0];
      for (const bad of ['http://provider.example/x', 'javascript:alert(1)', 'not a url']) {
        service.getEnrollmentUrl.and.returnValue(of({ url: bad }));
        component.enroll(sec, sec.paymentMethodEnrollmentOffers![0]);
      }
      expect(navigated).toEqual([]);
      expect(messages.add).toHaveBeenCalledTimes(3);
      expect(messages.add).toHaveBeenCalledWith(
        'adyenMySubscriptions.paymentMethodAddUnavailable', GlobalMessageType.MSG_TYPE_ERROR);
    });

    const withOffer = { sections: [section({ paymentMethodEnrollmentOffers: [
      { subscriptionCode: 'S-1', notice: 'ADDS_METHOD' as const }] })] };

    it('requests the url and navigates to it', () => {
      create(withOffer);
      service.getEnrollmentUrl.and.returnValue(of({ url: 'https://provider.example/x' }));
      const sec = component.sections$.value[0];
      component.enroll(sec, sec.paymentMethodEnrollmentOffers![0]);
      expect(service.getEnrollmentUrl).toHaveBeenCalledWith('S-1', 'RECURLY');
      expect(navigated).toEqual(['https://provider.example/x']);
    });

    it('shows an error and does not navigate when no url comes back or the call is refused', () => {
      create(withOffer);
      const sec = component.sections$.value[0];
      service.getEnrollmentUrl.and.returnValue(of({ url: ' ' }));
      component.enroll(sec, sec.paymentMethodEnrollmentOffers![0]);
      service.getEnrollmentUrl.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
      component.enroll(sec, sec.paymentMethodEnrollmentOffers![0]);
      expect(navigated).toEqual([]);
      expect(messages.add).toHaveBeenCalledTimes(2);
      expect(messages.add).toHaveBeenCalledWith(
        'adyenMySubscriptions.paymentMethodAddUnavailable', GlobalMessageType.MSG_TYPE_ERROR);
    });
  });
});
