import {Component, EventEmitter, OnInit, Output} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {ActiveCartFacade} from "@spartacus/cart/base/root";
import {CardWithAddress, CheckoutStepService} from "@spartacus/checkout/base/components";
import {CheckoutDeliveryAddressFacade} from "@spartacus/checkout/base/root";
import {Address, getLastValueSync, GlobalMessageService, TranslationService, UserAddressService} from "@spartacus/core";
import {Card, getAddressNumbers} from "@spartacus/storefront";
import {BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable} from "rxjs";
import {AdyenAddressService} from "../../service/adyen-address.service";
import {BillingAddress} from "../../core/models/occ.order.models";

@Component({
  selector: "cx-adyen-delivery-address",
  templateUrl: "./checkout-adyen-delivery-address.html",
  styleUrls: ['./checkout-adyen-delivery-address.scss'],
  standalone: false
})
export class AdyenCheckoutAdyenDeliveryAddressComponent implements OnInit {
  protected busy$ = new BehaviorSubject<boolean>(false);
  sameAsDeliveryAddress = true;
  showCompanyDataFields = false;


  cards$: Observable<CardWithAddress[]>;
  isUpdating$: Observable<boolean>;

  addressFormOpened = false;
  doneAutoSelect = false;

  selectedAddress$: BehaviorSubject<Address | undefined> = new BehaviorSubject<Address | undefined>(undefined);

  companyName: string;
  taxNumber: string;
  registrationNumber: string;

  @Output()
  setBillingAddress = new EventEmitter<any>();

  get isGuestCheckout(): boolean {
    return !!getLastValueSync(this.activeCartFacade.isGuestCart());
  }

  constructor(
    protected userAddressService: UserAddressService,
    protected checkoutDeliveryAddressFacade: CheckoutDeliveryAddressFacade,
    protected translationService: TranslationService,
    protected activeCartFacade: ActiveCartFacade,
    protected adyenAddressService: AdyenAddressService
  ) {
  }

  ngOnInit(): void {
    this.loadAddresses();

    this.cards$ = this.createCards();
    this.isUpdating$ = this.createIsUpdating();
  }

  getCardContent(
    address: Address,
    selected: any,
    textShipToThisAddress: string,
    textSelected: string,
    textPhone: string,
    textMobile: string
  ): Card {
    let region = '';
    if (address.region && address.region.isocode) {
      region = address.region.isocode + ', ';
    }

    const numbers = getAddressNumbers(address, textPhone, textMobile);

    return {
      role: 'region',
      title: '',
      textBold: address.firstName + ' ' + address.lastName,
      text: [
        address.line1,
        address.line2,
        address.town + ', ' + region + address.country?.isocode,
        address.postalCode,
        numbers,
      ],
      actions: [{name: textShipToThisAddress, event: 'send'}],
      header: selected && selected.id === address.id ? textSelected : '',
      label: address.defaultAddress
        ? 'addressBook.defaultDeliveryAddress'
        : 'addressBook.additionalDeliveryAddress',
    } as Card;
  }

  selectAddress(address: Address): void {

    if (address?.id === getLastValueSync(this.selectedAddress$)?.id) {
      return;
    }

    this.setAddress(address);
  }

  onCompanyNameChange(event: Event){
   this.companyName = (event.target as HTMLInputElement).value
  }

  onTaxNumberChange(event: Event){
    this.taxNumber = (event.target as HTMLInputElement).value
  }

  onRegistrationNumberChange(event: Event){
    this.registrationNumber = (event.target as HTMLInputElement).value
  }

  addAddress(address: Address | undefined): void {
    if (!address) {
      return;
    }

    let billingAddress: BillingAddress = {
      ...address,
      taxNumber: this.taxNumber,
      registrationNumber: this.registrationNumber,
      companyName: this.companyName
    }

    this.busy$.next(true);
    this.doneAutoSelect = true;

    this.adyenAddressService.adyenAddUserAddress(billingAddress).subscribe({
      next: (createdAddress) => {
        this.setBillingAddress.emit(billingAddress);
        this.loadAddresses();
        this.busy$.next(false);
        this.selectedAddress$.next(createdAddress);
        this.hideNewAddressForm();
      },
      error: () => {
        this.onError();
        this.doneAutoSelect = false;
      }
    })
  }

  showNewAddressForm(): void {
    this.addressFormOpened = true;
  }

  hideNewAddressForm(): void {
    this.addressFormOpened = false;
  }

  protected loadAddresses(): void {
    if (!this.isGuestCheckout) {
      this.userAddressService.loadAddresses();
    }
  }

  protected createCards(): Observable<CardWithAddress[]> {
    const addresses$ = combineLatest([
      this.getSupportedAddresses(),
      this.selectedAddress$,
    ]);
    const translations$ = combineLatest([
      this.translationService.translate('adyenCheckout.selectAddress'),
      this.translationService.translate('addressCard.selected'),
      this.translationService.translate('addressCard.phoneNumber'),
      this.translationService.translate('addressCard.mobileNumber'),
    ]);

    return combineLatest([addresses$, translations$]).pipe(
      map(
        ([
           [addresses, selected],
           [textSelectBillingAddress, textSelected, textPhone, textMobile],
         ]) =>
          addresses?.map((address) => ({
            address,
            card: this.getCardContent(
              address,
              selected,
              textSelectBillingAddress,
              textSelected,
              textPhone,
              textMobile
            ),
          }))
      )
    );
  }

  protected getSupportedAddresses(): Observable<Address[]> {
    return this.userAddressService.getAddresses();
  }

  protected createIsUpdating(): Observable<boolean> {
    return combineLatest([
      this.busy$,
      this.userAddressService.getAddressesLoading(),
      this.getAddressLoading(),
    ]).pipe(
      map(
        ([busy, userAddressLoading, deliveryAddressLoading]) =>
          busy || userAddressLoading || deliveryAddressLoading
      ),
      distinctUntilChanged()
    );
  }

  protected getAddressLoading(): Observable<boolean> {
    return this.checkoutDeliveryAddressFacade.getDeliveryAddressState().pipe(
      map((state) => state.loading),
      distinctUntilChanged()
    );
  }

  protected setAddress(address?: Address): void {
    this.selectedAddress$.next(address);
    this.setBillingAddress.emit(address);
  }

  toggleSameAsDeliveryAddress(): void {
    this.sameAsDeliveryAddress = !this.sameAsDeliveryAddress;

    if (this.sameAsDeliveryAddress) {
      this.setAddress(undefined)
    }
  }

  toggleShowCompanyDataFields(): void {
    this.showCompanyDataFields = !this.showCompanyDataFields;
  }

  protected onError(): void {
    this.busy$.next(false);
  }
}
