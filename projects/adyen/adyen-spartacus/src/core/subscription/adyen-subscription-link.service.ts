import {inject, Injectable, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {BehaviorSubject, filter, Observable, Subscription, take, timer} from 'rxjs';
import {GlobalMessageService, Translatable} from '@spartacus/core';

/**
 * Semantic route of the My Subscriptions page (CMS content page labelled `/my-account/subscriptions`);
 * the path is registered in {@link adyenSubscriptionsRoutingConfig}.
 */
export const MY_SUBSCRIPTIONS_ROUTE = 'mySubscriptions';

/**
 * State of the "Manage your subscriptions" link that is shown below the global messages after a duplicate-subscription
 * message (cart add / validation, payment refusal). `cx-global-message` renders translated text only, so the link is a
 * separate component ({@link AdyenSubscriptionLinkComponent}, registered in the `cx-header` outlet) driven by this service.
 * The link is tied to its message: it hides as soon as that message is no longer in {@link GlobalMessageService}
 * (expired or closed). `linkTimeout` is only a fallback.
 */
@Injectable({providedIn: 'root'})
export class AdyenSubscriptionLinkService {
  protected platformId: object = inject(PLATFORM_ID);
  protected globalMessageService: GlobalMessageService = inject(GlobalMessageService);
  protected linkTimeout: number = 20000;
  protected visible = new BehaviorSubject<boolean>(false);
  protected hideTimer?: Subscription;
  protected messageWatch?: Subscription;

  readonly visible$: Observable<boolean> = this.visible.asObservable();

  /**
   * Shows the link. `message` is the global message the link belongs to (`{key}` for a translatable message,
   * `{raw}` for an already translated text); the link hides when it disappears. `timeout` (ms) is a fallback.
   */
  show(timeout: number = this.linkTimeout, message?: Translatable): void {
    this.stopWatching();
    this.visible.next(true);
    if (message) {
      this.messageWatch = this.globalMessageService.get().pipe(
        filter((entities) => !this.isPresent(entities, message)),
        take(1)
      ).subscribe(() => this.hide());
    }
    // no timers on the server: they would keep the app unstable until they fire
    if (this.visible.value && isPlatformBrowser(this.platformId)) {
      this.hideTimer = timer(timeout).subscribe(() => this.hide());
    }
  }

  hide(): void {
    this.stopWatching();
    this.visible.next(false);
  }

  protected stopWatching(): void {
    this.hideTimer?.unsubscribe();
    this.hideTimer = undefined;
    this.messageWatch?.unsubscribe();
    this.messageWatch = undefined;
  }

  protected isPresent(entities: { [type: string]: Translatable[] } | undefined, message: Translatable): boolean {
    return Object.values(entities ?? {}).some((list) => (list ?? []).some((entry) =>
      (!!message.key && entry.key === message.key) || (!!message.raw && entry.raw === message.raw)));
  }
}
