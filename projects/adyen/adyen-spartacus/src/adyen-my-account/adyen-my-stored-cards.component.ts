import {Component, OnDestroy, OnInit} from "@angular/core";
import {AdyenMyAccountService} from "../service/adyen-my-account.service";
import {BehaviorSubject, combineLatest, firstValueFrom, map, Observable, Subscription} from "rxjs";
import {Card as UiCard} from "@spartacus/storefront";
import {TranslationService} from "@spartacus/core";

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

  constructor(protected adyenMyAccountService: AdyenMyAccountService,
              protected translationService: TranslationService) {
    this.cardsWithId$ = new BehaviorSubject<CardWithId[]>([]);
    this.cardsLoading$ = new BehaviorSubject<boolean>(true);
  }

  cardsWithId$: BehaviorSubject<CardWithId[]>
  cardsLoading$: BehaviorSubject<boolean>

  ngOnInit(): void {
    this.subscriptions$.add(this.createCards().subscribe(cards => {
      this.cardsWithId$.next(cards);
      this.cardsLoading$.next(false);
    }))
  }


  protected createCards(): Observable<CardWithId[]> {
    const storedCards$ = this.adyenMyAccountService.getStoredCards();
    let translations$ = combineLatest([
      this.translationService.translate('common.remove'),
    ]);


    return combineLatest([storedCards$, translations$]).pipe(
      map(([recurringDetails, [removeTranslation]]) => recurringDetails.map(recurringDetail => {
          return {
            id: recurringDetail.recurringDetailReference,
            card: {
              title: recurringDetail.card.holderName,
              actions: [{name: removeTranslation, event: 'delete'}],
              paragraphs: [
                {
                  text: [
                    '****' + recurringDetail.card.number,
                    Number.parseInt(recurringDetail.card.expiryMonth) < 10 ? '0' + recurringDetail.card.expiryMonth + '/' + recurringDetail.card.expiryYear : ''
                  ]
                },
                {
                  text: [
                    recurringDetail.billingAddress ? recurringDetail.billingAddress.street : '',
                    recurringDetail.billingAddress ? recurringDetail.billingAddress.city : '',
                    recurringDetail.billingAddress ? recurringDetail.billingAddress.country + '\xa0' + recurringDetail.billingAddress.postalCode : '',
                  ]
                }
              ]
            }
          }
        }
      ))
    )
  }

  async deleteCard(cardId: string): Promise<void> {
    let object$ = this.adyenMyAccountService.removeStoredCard(cardId);
    this.cardsLoading$.next(true);

    await firstValueFrom(object$);

    this.subscriptions$.add(this.createCards().subscribe(cards => {
      this.cardsWithId$.next(cards);
      this.cardsLoading$.next(false);
    }))
  }

  ngOnDestroy(): void {
    this.subscriptions$.unsubscribe();
  }

}
