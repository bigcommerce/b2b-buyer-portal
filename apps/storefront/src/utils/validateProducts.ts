import { LangFormatFunction } from '@/lib/lang';
import { validateProduct } from '@/shared/service/b2b/graphql/product';

import { snackbar } from './b3Tip';

interface Option {
  optionId: number | `attribute[${number}]`;
  optionValue: string;
}

export const validateProducts = async (
  products: CustomFieldItems[],
  b3Lang: LangFormatFunction,
) => {
  const validationPromises = products.map(({ node: product }) => {
    const { productId, quantity, productsSearch } = product;
    const { variantId, newSelectOptionList } = productsSearch;

    const productOptions = newSelectOptionList.map((option: Option) => {
      if (typeof option.optionId === 'string' && option.optionId.includes('attribute')) {
        // The passed in optionIds are formatted like "attribute[123]"
        // This extracts the number from the optionId
        return {
          optionId: Number(option.optionId.split('[')[1].split(']')[0]),
          optionValue: option.optionValue,
        };
      }

      return {
        optionId: Number(option.optionId),
        optionValue: option.optionValue,
      };
    });

    return validateProduct({
      productId: Number(productId),
      variantId: Number(variantId),
      quantity: Number(quantity),
      productOptions,
    });
  });

  const settledResults = await Promise.allSettled(validationPromises);

  settledResults.forEach((result, index) => {
    // Network or unexpected error
    if (result.status === 'rejected') {
      const { productName } = products[index].node;

      snackbar.error(b3Lang('quotes.productValidationFailed', { productName }));

      return;
    }

    const { responseType, message } = result.value;

    if (responseType === 'ERROR') {
      snackbar.error(message);
    }
  });

  const validProducts = products.filter((_, index) => {
    const res = settledResults[index];

    return res.status === 'fulfilled' && res.value.responseType !== 'ERROR';
  });

  return validProducts;
};
