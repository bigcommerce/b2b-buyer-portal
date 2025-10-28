import { validateProduct } from '@/shared/service/b2b/graphql/product';

interface Option {
  optionId: number | `attribute[${number}]`;
  optionValue: string;
}

export interface ValidationError {
  type: 'network' | 'validation';
  message?: string;
  translationKey?: string;
  translationParams?: Record<string, string | number>;
}

export interface ValidationResult {
  validProducts: CustomFieldItems[];
  errors: ValidationError[];
}

export const validateProducts = async (products: CustomFieldItems[]): Promise<ValidationResult> => {
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

  const errors: ValidationError[] = [];

  settledResults.forEach((result, index) => {
    // Network or unexpected error
    if (result.status === 'rejected') {
      const { productName } = products[index].node;
      errors.push({
        type: 'network',
        translationKey: 'quotes.productValidationFailed',
        translationParams: { productName: productName || '' },
      });
      return;
    }

    const { responseType, message } = result.value;

    if (responseType === 'ERROR') {
      errors.push({
        type: 'validation',
        message,
      });
    }
  });

  const validProducts = products.filter((_, index) => {
    const res = settledResults[index];
    return res.status === 'fulfilled' && res.value.responseType !== 'ERROR';
  });

  return { validProducts, errors };
};
