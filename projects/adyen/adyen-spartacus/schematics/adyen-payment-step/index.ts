import { Rule, SchematicContext, url, apply, template, mergeWith, chain, MergeStrategy, move } from '@angular-devkit/schematics';
import { strings } from '@angular-devkit/core';

function applyTemplateAndMerge(sourcePath: string, destinationPath: string, _options: any): Rule {
  const sourceTemplates = url(sourcePath);
  const sourceParameterizedTemplate = apply(sourceTemplates, [
    template({
      ..._options,
      ...strings,
    }),
    move(destinationPath),
  ]);

  return mergeWith(sourceParameterizedTemplate, MergeStrategy.Overwrite);
}

export function adyenPaymentStep(_options: any): Rule {
  return (_: any, _context: SchematicContext) => {
    const checkoutDestinationPath = 'src/app/spartacus/features/checkout/checkout-feature.module.ts';
    const checkoutSourcePath = './files/checkout-feature.module.ts';

    const orderDestinationPath = 'src/app/spartacus/features/order/order-feature.module.ts';
    const orderSourcePath = './files/order-feature.module.ts';

    return chain([
      applyTemplateAndMerge(checkoutSourcePath, checkoutDestinationPath, _options),
      applyTemplateAndMerge(orderSourcePath, orderDestinationPath, _options)
    ]);
  };
}
