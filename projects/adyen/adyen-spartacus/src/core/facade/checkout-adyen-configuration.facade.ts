import {Observable} from "rxjs";

export abstract class CheckoutAdyenConfigurationFacade {

  abstract getConfiguration(): Observable<any>;

  abstract getConfigurationState(): Observable<any>;

}
