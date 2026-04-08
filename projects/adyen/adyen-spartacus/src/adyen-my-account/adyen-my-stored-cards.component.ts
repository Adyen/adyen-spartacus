import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Card as UiCard } from "@spartacus/storefront";
import { TranslationService, UserIdService } from "@spartacus/core";
import { BehaviorSubject, combineLatest, EMPTY, firstValueFrom, map, Observable, of, Subscription } from "rxjs";
import { catchError, finalize, switchMap, take } from "rxjs/operators";
import { AdyenMyAccountService } from "../service/adyen-my-account.service";
import { StoredPaymentMethodResource, ZeroAuthRequestBody, ZeroAuthResponse } from "../core/models/occ.my-account.models";
import { AdyenConfigData } from "../core/models/occ.config.models";
import { AdditionalDetailsActions, CoreConfiguration, DropinConfiguration, SubmitActions, UIElement } from "@adyen/adyen-web";
import { AdyenCheckout, AdyenCheckoutError, Dropin } from "@adyen/adyen-web/auto";

interface CardWithId {
  card: UiCard;
  id: string;
}

@Component({
  selector: 'cx-adyen-my-stored-cards',
  templateUrl: './adyen-my-stored-cards.component.html',
  styleUrls: ['adyen-my-stored-cards.component.scss']
})
export class AdyenMyStoredCardsComponent implements OnInit, OnDestroy {
  subscriptions$ = new Subscription();
  @ViewChild('hook', { static: true }) hook: ElementRef;
  dropIn: Dropin;
  latestDropInConfig: AdyenConfigData | null = null;

  constructor(
    protected adyenMyAccountService: AdyenMyAccountService,
    protected translationService: TranslationService,
    protected userIdService: UserIdService
  ) {
    this.cardsWithId$ = new BehaviorSubject<CardWithId[]>([]);
    this.cardsLoading$ = new BehaviorSubject<boolean>(true);
    this.dropinError$ = new BehaviorSubject<string | null>(null);
  }

  cardsWithId$: BehaviorSubject<CardWithId[]>;
  cardsLoading$: BehaviorSubject<boolean>;
  dropinError$: BehaviorSubject<string | null>;

  ngOnInit(): void {
    this.reloadCards();
    this.initializeDropIn();
  }

  protected initializeDropIn(): void {
    this.subscriptions$.add(
      this.userIdService.takeUserId().pipe(
        take(1),
        switchMap((userId) => this.adyenMyAccountService.getCheckoutConfiguration(userId)),
        map((config) => {
          if (!config?.adyenClientKey?.trim()) {
            throw new Error('Missing `adyenClientKey` in the backend configuration response.');
          }
          return config;
        }),
        catchError((error) => {
          console.error('Failed to load Drop-in configuration for My Account.', error);
          this.dropinError$.next('Missing Adyen configuration from the checkout-configuration endpoint.');
          return EMPTY;
        })
      ).subscribe(async (config) => {
        this.latestDropInConfig = config;
        await this.mountDropIn(config);
      })
    );
  }

  protected async mountDropIn(config: AdyenConfigData): Promise<void> {
    try {
      const adyenCheckout = await AdyenCheckout(this.getAdyenCheckoutConfig(config));
      if (this.dropIn) {
        this.dropIn.unmount();
      }
      this.dropIn = new Dropin(adyenCheckout, this.getDropinConfiguration(config)).mount(this.hook.nativeElement);
      this.dropinError$.next(null);
    } catch (error) {
      console.error('Failed to initialize Adyen Drop-in for My Account.', error);
      this.dropinError$.next('Failed to start Adyen Drop-in. Check `adyenClientKey` and environment settings.');
    }
  }

  protected refreshDropIn(): void {
    if (this.latestDropInConfig) {
      void this.mountDropIn(this.latestDropInConfig);
      return;
    }

    this.initializeDropIn();
  }

  protected createCards(): Observable<CardWithId[]> {
    const storedCards$ = this.adyenMyAccountService.getStoredCards();
    const translations$ = combineLatest([
      this.translationService.translate('common.remove'),
    ]);

    return combineLatest([storedCards$, translations$]).pipe(
      map(([storedPaymentMethods, [removeTranslation]]) =>
        (storedPaymentMethods as StoredPaymentMethodResource[]).map(
          (storedPaymentMethod: StoredPaymentMethodResource) => {
            return {
              id: storedPaymentMethod.id,
              card: {
                title: storedPaymentMethod.holderName || storedPaymentMethod.id || '',
                actions: [{ name: removeTranslation, event: 'delete' }],
                paragraphs: [
                  {
                    text: [
                      '****' + storedPaymentMethod.lastFour,
                      storedPaymentMethod.expiryMonth + '/' + storedPaymentMethod.expiryYear
                    ]
                  }
                ]
              }
            };
          }
        )
      )
    );
  }

  protected reloadCards(): void {
    this.cardsLoading$.next(true);

    this.subscriptions$.add(
      this.createCards().pipe(
        take(1),
        catchError((error) => {
          console.error('Failed to reload stored cards.', error);
          this.dropinError$.next('Failed to reload stored cards.');
          return of([] as CardWithId[]);
        }),
        finalize(() => this.cardsLoading$.next(false))
      ).subscribe(cards => {
        this.cardsWithId$.next(cards);
      })
    );
  }

  protected getAdyenCheckoutConfig(adyenConfig: AdyenConfigData): CoreConfiguration {
    return {
      paymentMethodsResponse: {
        paymentMethods: adyenConfig.paymentMethods,
        storedPaymentMethods: adyenConfig.storedPaymentMethodList,
      },
      locale: adyenConfig.shopperLocale,
      countryCode: adyenConfig.countryCode,
      environment: this.castToEnvironment(adyenConfig.environmentMode),
      clientKey: adyenConfig.adyenClientKey,
      amount: adyenConfig.amount,
      allowPaymentMethods: adyenConfig.allowedCards?.map(card => card.type) || [],
      analytics: {
        enabled: false,
      },
      onError: (error: AdyenCheckoutError) => this.handleDropInError(error),
      onSubmit: (state: any, element: UIElement, actions: SubmitActions) => this.handleDropInSubmit(state?.data, actions),
    };
  }

  protected castToEnvironment(env: string): CoreConfiguration['environment'] {
    const validEnvironments: CoreConfiguration['environment'][] = ['test', 'live', 'live-us', 'live-au', 'live-apse', 'live-in'];
    if (validEnvironments.includes(env as CoreConfiguration['environment'])) {
      return env as CoreConfiguration['environment'];
    }
    throw new Error(`Invalid environment: ${env}`);
  }

  protected getDropinConfiguration(adyenConfig: AdyenConfigData): DropinConfiguration {
    return {
      paymentMethodsConfiguration: {
        card: {
          type: 'card',
          hasHolderName: true,
          holderNameRequired: adyenConfig.cardHolderNameRequired,
          enableStoreDetails: adyenConfig.showRememberTheseDetails,
        },
        paypal: {
          intent: 'tokenize',
        },
      },
    };
  }
  
private handleResponse(response: ZeroAuthResponse | void, actions: SubmitActions | AdditionalDetailsActions) {
    if (!response) {
      actions.reject();
      return;
    }

    const resultCode = (response.resultCode || '').trim();
    const action = response.action ? { ...response.action } : undefined;

    if (typeof action?.type === 'string' && action.type.toLowerCase() === 'sdk' && !action.paymentMethodType) {
      action.paymentMethodType = 'paypal';
    }

    if (action) {
      actions.resolve({
        ...response,
        action,
      } as any);
      return;
    }

    if (resultCode) {
      actions.resolve(response as any);

      if (resultCode.toLowerCase() === 'authorised') {
        this.onSuccess();
      }
      return;
    }

    actions.reject();
  }

  protected handleDropInSubmit(data: any, actions: SubmitActions) {
    const paymentMethod = data?.paymentMethod || {};
    const paymentMethodType = (paymentMethod.type || '').toLowerCase();

    const requestBody: ZeroAuthRequestBody = paymentMethodType === 'paypal'
      ? {
          paymentMethodDto: {
            ...paymentMethod,
            type: paymentMethod.type || 'paypal',
          },
        }
      : {
          paymentMethodDto: {
            type: (paymentMethod.type).toUpperCase(),
            encryptedCardNumber: paymentMethod.encryptedCardNumber || '',
            encryptedExpiryMonth: paymentMethod.encryptedExpiryMonth || '',
            encryptedExpiryYear: paymentMethod.encryptedExpiryYear || '',
            encryptedSecurityCode: paymentMethod.encryptedSecurityCode || '',
            holderName: paymentMethod.holderName || '',
          },
        };
        
    this.adyenMyAccountService.zeroAuth(requestBody).subscribe(
      result => this.handleResponse(result, actions),
      error => {
        console.error('Failed to submit Zero Auth request.', error);
        this.dropinError$.next('Failed to save payment details. Please try again.');
        actions.reject();
      }
    );
  }

  protected handleDropInError(error: AdyenCheckoutError): void {
    console.error('Adyen drop-in error:', error);
  }

  async deleteCard(cardId: string): Promise<void> {
    const objects = this.adyenMyAccountService.removeStoredCard(cardId);
    this.cardsLoading$.next(true);
    
    await firstValueFrom(objects);
    this.reloadCards();
  }

  ngOnDestroy(): void {
    if (this.dropIn) {
      this.dropIn.unmount();
    }
    this.subscriptions$.unsubscribe();
  }


   onSuccess(): void {
    this.reloadCards();
    this.refreshDropIn();
  }
}
