import {AfterViewInit, Component, ElementRef, OnDestroy} from "@angular/core";
import {AdyenDataCollectionConfigurationService} from "../service/adyen-data-collection-configuration.service";
import {Subscription} from "rxjs";


@Component({
  selector: 'cx-adyen-data-collection',
  templateUrl: './adyen-data-collection.component.html',
  standalone: false
})
export class AdyenDataCollectionComponent implements AfterViewInit, OnDestroy {
  private subscriptions$ = new Subscription();


  constructor(protected dataCollectionService: AdyenDataCollectionConfigurationService, private elementRef: ElementRef<HTMLElement>) {
  }

  ngAfterViewInit(): void {
    this.subscriptions$.add(this.dataCollectionService.getDataCollectionConfiguration().subscribe(
      config => {
        if (config && config.dataCollectionEnabled) {

          let s = document.createElement("script");
          s.type = "text/javascript"
          s.src = "https://" + config.checkoutShopperHost + "/checkoutshopper/assets/js/datacollection/datacollection.js"
          let dataCollectionElements = this.elementRef.nativeElement.getElementsByClassName("adyen-data-collection");

          if (dataCollectionElements.length == 1) {
            dataCollectionElements[0].appendChild(s)
          } else {
            console.error("Invalid data collection nodes number")
          }

        }
      }
    )
  )
  }

  ngOnDestroy() {
    this.subscriptions$.unsubscribe();
  }
}
