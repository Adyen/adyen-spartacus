import { Rule } from '@angular-devkit/schematics';
import { addRootImport } from '@schematics/angular/utility';
import {Schema} from "../payment-step/schema";


export function ngAdd(options: Schema): Rule {
  // Add an import `AdyenPayments` from `adyen-payments` to the root of the user's project.
  return addRootImport(options.project, ({code, external}) =>
    code`${external('AdyenPayments', 'adyen-payments')}`);
}
