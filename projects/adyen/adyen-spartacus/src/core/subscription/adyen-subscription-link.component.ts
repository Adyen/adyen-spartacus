import {ChangeDetectionStrategy, Component} from '@angular/core';
import {ICON_TYPE} from '@spartacus/storefront';
import {AdyenSubscriptionLinkService, MY_SUBSCRIPTIONS_ROUTE} from './adyen-subscription-link.service';

/**
 * "Manage your subscriptions" link shown under the global messages after a duplicate-subscription message.
 * Registered by {@link AdyenCartModificationModule} in the `cx-header` outlet (position AFTER, i.e. directly below `cx-global-message`).
 * The host is sticky like the message; the offset below it is `--adyen-subscription-link-top`.
 */
@Component({
  selector: 'cx-adyen-subscription-link',
  template: `
    <div class="alert alert-info cx-adyen-subscription-link" *ngIf="linkService.visible$ | async">
      <span class="alert-icon"><cx-icon [type]="iconTypes.INFO"></cx-icon></span>
      <a [routerLink]="{cxRoute: route} | cxUrl" (click)="linkService.hide()">{{ 'adyenCartModification.link.mySubscriptions' | cxTranslate }}</a>
      <button class="close" type="button" title="{{ 'common.close' | cxTranslate }}" (click)="linkService.hide()">
        <cx-icon [type]="iconTypes.CLOSE"></cx-icon>
      </button>
    </div>
  `,
  // the live region is the always-present host, so content added later is announced
  host: {role: 'status'},
  styleUrl: './adyen-subscription-link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class AdyenSubscriptionLinkComponent {
  readonly iconTypes = ICON_TYPE;
  readonly route = MY_SUBSCRIPTIONS_ROUTE;

  constructor(public linkService: AdyenSubscriptionLinkService) {
  }
}
