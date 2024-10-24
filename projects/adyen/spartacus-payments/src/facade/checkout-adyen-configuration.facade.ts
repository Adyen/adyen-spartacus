import {Observable} from "rxjs";

export class CheckoutAdyenConfigurationFacade {

  getConfiguration(): Observable<CheckoutPaymentConfiguration>;

  getConfigurationState(): Observable<CheckoutPaymentConfigurationState>;

}
