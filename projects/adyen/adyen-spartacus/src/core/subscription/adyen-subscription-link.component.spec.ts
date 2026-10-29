import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {By} from '@angular/platform-browser';
import {of} from 'rxjs';
import {GlobalMessageService, I18nTestingModule, provideConfig, RoutingConfig, UrlModule} from '@spartacus/core';
import {IconModule} from '@spartacus/storefront';
import {RouterModule} from '@angular/router';
import {AdyenSubscriptionLinkComponent} from './adyen-subscription-link.component';
import {AdyenSubscriptionLinkService} from './adyen-subscription-link.service';
import {adyenSubscriptionsRoutingConfig} from '../config/adyen-subscriptions-routing-config';


describe('AdyenSubscriptionLinkComponent', () => {
  let fixture: ComponentFixture<AdyenSubscriptionLinkComponent>;
  let linkService: AdyenSubscriptionLinkService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterModule, I18nTestingModule, UrlModule, IconModule],
      declarations: [AdyenSubscriptionLinkComponent],
      providers: [
        provideRouter([]),
        {provide: GlobalMessageService, useValue: {get: () => of({})}},
        provideConfig(adyenSubscriptionsRoutingConfig as RoutingConfig)
      ]
    });
    fixture = TestBed.createComponent(AdyenSubscriptionLinkComponent);
    linkService = TestBed.inject(AdyenSubscriptionLinkService);
    fixture.detectChanges();
  });

  it('renders nothing until the link is requested', () => {
    expect(fixture.debugElement.query(By.css('a'))).toBeNull();
  });

  it('renders a link to the My Subscriptions route and hides on click', () => {
    linkService.show(1000);
    fixture.detectChanges();

    const anchor = fixture.debugElement.query(By.css('a'));
    expect(anchor.nativeElement.getAttribute('href')).toMatch(/\/my-account\/subscriptions$/);
    expect(anchor.nativeElement.textContent).toContain('adyenCartModification.link.mySubscriptions');

    anchor.nativeElement.click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('a'))).toBeNull();
    linkService.hide();
  });

  it('hides when the close button is clicked', () => {
    linkService.show(1000);
    fixture.detectChanges();

    fixture.debugElement.query(By.css('button.close')).nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('a'))).toBeNull();
    expect(fixture.debugElement.query(By.css('button.close'))).toBeNull();
  });

  it('is a polite live region on the host', () => {
    expect(fixture.nativeElement.getAttribute('role')).toBe('status');
  });
});
