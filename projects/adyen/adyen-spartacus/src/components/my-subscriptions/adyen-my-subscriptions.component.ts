import { Component, OnDestroy, OnInit } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { GlobalMessageService, GlobalMessageType, TranslationService } from "@spartacus/core";
import { BehaviorSubject, Subscription } from "rxjs";
import { finalize, take } from "rxjs/operators";
import { AdyenSubscriptionsService } from "../../core/services/adyen-subscriptions.service";
import { AdyenLoggerService } from "../../core/services/adyen-logger.service";
import {
  AdyenSubscriptionChangeOffer,
  AdyenSubscriptionEnrollmentOffer,
  AdyenSubscriptionEntry,
  AdyenSubscriptionPaymentMethodChangeResult,
  AdyenSubscriptionPaymentMethodOption,
  AdyenSubscriptionSection,
  AdyenSubscriptionState
} from "../../core/models/occ.subscriptions.models";

const I18N = 'adyenMySubscriptions';

/** One glyph per state; purely decorative (aria-hidden), the state is always said in words as well. */
const STATE_GLYPHS: { [state in AdyenSubscriptionState]: string } = {
  SETTING_UP: '⚙',
  ACTIVE: '↻',
  STARTING_SOON: '◷',
  ENDING: '⏱',
  PAUSED: '⏸',
  PAST_DUE: '⚠',
  PAST_DUE_ENDING: '⚠',
  ENDED: '✕',
  UNAVAILABLE: '?'
};

@Component({
  selector: 'cx-adyen-my-subscriptions',
  templateUrl: './adyen-my-subscriptions.component.html',
  styleUrls: ['adyen-my-subscriptions.component.scss'],
  standalone: false
})
export class AdyenMySubscriptionsComponent implements OnInit, OnDestroy {
  subscriptions$ = new Subscription();

  sections$ = new BehaviorSubject<AdyenSubscriptionSection[]>([]);
  loading$ = new BehaviorSubject<boolean>(true);
  loadFailed$ = new BehaviorSubject<boolean>(false);
  /** True while a mutation is in flight; every action is disabled meanwhile so nothing is submitted twice. */
  busy$ = new BehaviorSubject<boolean>(false);

  /** Subscription whose cancellation the shopper is being asked to confirm. */
  cancelConfirm: { platform: string; code: string } | null = null;
  protected selectedMethod: { [key: string]: string } = {};
  protected applyToAllChecked: { [key: string]: boolean } = {};

  constructor(
    protected subscriptionsService: AdyenSubscriptionsService,
    protected globalMessageService: GlobalMessageService,
    protected translationService: TranslationService,
    protected logger: AdyenLoggerService
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    this.subscriptions$.unsubscribe();
  }

  protected reload(): void {
    this.loading$.next(true);
    this.subscriptions$.add(
      this.subscriptionsService.getSubscriptions().pipe(
        take(1),
        finalize(() => this.loading$.next(false))
      ).subscribe({
        next: (overview) => {
          this.loadFailed$.next(false);
          this.selectedMethod = {};
          this.applyToAllChecked = {};
          this.cancelConfirm = null;
          this.sections$.next(overview?.sections ?? []);
        },
        error: (error) => {
          this.sections$.next([]);
          // 404 means there is no billing platform to show: the empty state, not an error.
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.loadFailed$.next(false);
            return;
          }
          this.logger.error('Failed to load subscriptions.', error);
          this.loadFailed$.next(true);
        }
      })
    );
  }

  // ---- rendering helpers ------------------------------------------------------------------------------------

  stateKey(entry: AdyenSubscriptionEntry): string {
    const known = entry.state && STATE_GLYPHS[entry.state] !== undefined;
    const state = known ? entry.state : 'UNAVAILABLE';
    const pascal = state.toLowerCase().split('_').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    return `${I18N}.state${pascal}${entry.effectiveDate ? 'Dated' : ''}`;
  }

  stateGlyph(entry: AdyenSubscriptionEntry): string {
    return STATE_GLYPHS[entry.state] ?? '';
  }

  tone(entry: AdyenSubscriptionEntry): string {
    return entry.tone || 'normal';
  }

  /** The store is named only when the platform has more than one account here. */
  nameAccounts(section: AdyenSubscriptionSection): boolean {
    return (section.paymentMethodChangeOffers?.length ?? 0) > 1
      || (section.paymentMethodEnrollmentOffers?.length ?? 0) > 1;
  }

  showRowControl(section: AdyenSubscriptionSection, entry: AdyenSubscriptionEntry): boolean {
    return !!section.rowPaymentMethodControlOffered && !!entry.paymentMethodControl && !!entry.paymentMethodChangeable;
  }

  /** Said only where the section offers a change somewhere, the state would make a card matter, and nothing moves this row. */
  showRowUnavailable(section: AdyenSubscriptionSection, entry: AdyenSubscriptionEntry): boolean {
    return !!section.paymentMethodChangeOffered && !!entry.paymentMethodChangeable && !entry.paymentMethodChangeCovered;
  }

  hasActions(section: AdyenSubscriptionSection, entry: AdyenSubscriptionEntry): boolean {
    return !!entry.cancellable || this.showRowControl(section, entry) || this.showRowUnavailable(section, entry);
  }

  rowKey(section: AdyenSubscriptionSection, entry: AdyenSubscriptionEntry, index?: number): string {
    return `${section.platformCode}:row:${entry.code ?? index ?? ''}`;
  }

  offerKey(section: AdyenSubscriptionSection, offer: AdyenSubscriptionChangeOffer): string {
    return `${section.platformCode}:account:${offer.subscriptionCode}`;
  }

  // ---- payment-method picker state --------------------------------------------------------------------------

  /** What is billing now when the shopper has not picked, else the first option. */
  selectedId(key: string, platformOptions?: AdyenSubscriptionPaymentMethodOption[],
             vaultOptions?: AdyenSubscriptionPaymentMethodOption[]): string {
    if (this.selectedMethod[key]) {
      return this.selectedMethod[key];
    }
    const all = [...(platformOptions ?? []), ...(vaultOptions ?? [])];
    return (all.find((o) => o.current) ?? all[0])?.id ?? '';
  }

  selectMethod(key: string, id: string): void {
    this.selectedMethod[key] = id;
  }

  isApplyToAll(key: string): boolean {
    return !!this.applyToAllChecked[key];
  }

  setApplyToAll(key: string, checked: boolean): void {
    this.applyToAllChecked[key] = checked;
  }

  // ---- actions ----------------------------------------------------------------------------------------------

  askCancel(section: AdyenSubscriptionSection, entry: AdyenSubscriptionEntry): void {
    this.cancelConfirm = { platform: section.platformCode, code: entry.code };
  }

  isCancelConfirming(section: AdyenSubscriptionSection, entry: AdyenSubscriptionEntry): boolean {
    return this.cancelConfirm?.platform === section.platformCode && this.cancelConfirm?.code === entry.code;
  }

  dismissCancel(): void {
    this.cancelConfirm = null;
  }

  cancel(section: AdyenSubscriptionSection, entry: AdyenSubscriptionEntry): void {
    if (this.busy$.value) {
      return;
    }
    this.busy$.next(true);
    this.cancelConfirm = null;
    this.subscriptions$.add(
      this.subscriptionsService.cancelSubscription(entry.code, section.platformCode).pipe(
        take(1),
        finalize(() => this.busy$.next(false))
      ).subscribe({
        next: () => {
          this.say('cancelSuccess', GlobalMessageType.MSG_TYPE_CONFIRMATION);
          this.reload();
        },
        error: (error) => {
          // One refusal for every kind of no; the list is reloaded in case it is stale.
          this.logger.error('Failed to cancel subscription.', error);
          this.say('cancelError', GlobalMessageType.MSG_TYPE_ERROR);
          this.reload();
        }
      })
    );
  }

  changePaymentMethod(section: AdyenSubscriptionSection, code: string, key: string,
                      platformOptions?: AdyenSubscriptionPaymentMethodOption[],
                      vaultOptions?: AdyenSubscriptionPaymentMethodOption[],
                      allowApplyToAll = false): void {
    const methodId = this.selectedId(key, platformOptions, vaultOptions);
    if (this.busy$.value || !methodId) {
      return;
    }
    this.busy$.next(true);
    this.subscriptions$.add(
      this.subscriptionsService.changePaymentMethod(code, section.platformCode, methodId,
        allowApplyToAll && this.isApplyToAll(key)).pipe(
        take(1),
        finalize(() => this.busy$.next(false))
      ).subscribe({
        next: (result) => {
          this.reportChange(result);
          this.reload();
        },
        error: (error) => {
          this.logger.error('Failed to change the payment method.', error);
          this.say('paymentMethodError', GlobalMessageType.MSG_TYPE_ERROR);
          this.reload();
        }
      })
    );
  }

  changeEntry(section: AdyenSubscriptionSection, entry: AdyenSubscriptionEntry, index?: number): void {
    this.changePaymentMethod(section, entry.code, this.rowKey(section, entry, index),
      entry.paymentMethodOptions, entry.adyenVaultOptions, !!entry.paymentMethodShareable);
  }

  changeOffer(section: AdyenSubscriptionSection, offer: AdyenSubscriptionChangeOffer): void {
    this.changePaymentMethod(section, offer.subscriptionCode, this.offerKey(section, offer),
      offer.paymentMethodOptions, offer.adyenVaultOptions, false);
  }

  enroll(section: AdyenSubscriptionSection, offer: AdyenSubscriptionEnrollmentOffer): void {
    if (this.busy$.value) {
      return;
    }
    this.busy$.next(true);
    this.subscriptions$.add(
      this.subscriptionsService.getEnrollmentUrl(offer.subscriptionCode, section.platformCode).pipe(
        take(1),
        finalize(() => this.busy$.next(false))
      ).subscribe({
        next: (response) => {
          const url = response?.url?.trim();
          if (url && this.isHttps(url)) {
            // The URL can carry a credential: it is used once and never logged.
            this.navigate(url);
          } else {
            this.say('paymentMethodAddUnavailable', GlobalMessageType.MSG_TYPE_ERROR);
          }
        },
        error: () => this.say('paymentMethodAddUnavailable', GlobalMessageType.MSG_TYPE_ERROR)
      })
    );
  }

  /** Only https URLs are followed; anything else (javascript:, http:, garbage) is treated as no URL. */
  protected isHttps(url: string): boolean {
    try {
      return new URL(url).protocol === 'https:';
    } catch {
      return false;
    }
  }

  protected navigate(url: string): void {
    window.location.assign(url);
  }

  /** Same selection as the Accelerator's `MySubscriptionsPageController.report(...)`. */
  protected reportChange(result: AdyenSubscriptionPaymentMethodChangeResult | null | undefined): void {
    if (result?.partial) {
      this.say('paymentMethodSuccessSome', GlobalMessageType.MSG_TYPE_ERROR,
        { moved: result.moved, failed: result.failed });
      return;
    }
    if (result?.result === 'CHANGED_ALL_SUBSCRIPTIONS' && result.moved > 1) {
      this.say('paymentMethodSuccessCounted', GlobalMessageType.MSG_TYPE_CONFIRMATION, { count: result.moved });
      return;
    }
    switch (result?.result) {
      case 'CHANGED_THIS_SUBSCRIPTION':
        this.say('paymentMethodSuccessSubscription', GlobalMessageType.MSG_TYPE_CONFIRMATION);
        break;
      case 'CHANGED_ALL_SUBSCRIPTIONS':
        this.say('paymentMethodSuccessCustomer', GlobalMessageType.MSG_TYPE_CONFIRMATION);
        break;
      case 'NOT_SUPPORTED_HERE':
        this.say('paymentMethodUnsupported', GlobalMessageType.MSG_TYPE_INFO);
        break;
      default:
        this.say('paymentMethodError', GlobalMessageType.MSG_TYPE_ERROR);
    }
  }

  protected say(key: string, type: GlobalMessageType, params?: object): void {
    this.translationService.translate(`${I18N}.${key}`, params).pipe(take(1))
      .subscribe((text) => this.globalMessageService.add(text, type));
  }
}
