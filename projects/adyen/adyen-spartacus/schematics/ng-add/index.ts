import { chain, Rule, schematic, SchematicContext, Tree } from '@angular-devkit/schematics';



export function ngAdd(options: any): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    return chain([schematic('adyen-payment-step', options)])(tree, _context);
  };
}
