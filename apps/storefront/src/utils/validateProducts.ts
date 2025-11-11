import { validateProduct } from '@/shared/service/b2b/graphql/product';

interface Option {
  optionId: number | `attribute[${number}]`;
  optionValue: string;
}

interface NetworkValidationError {
  type: 'network';
  productName: string;
}

interface ServerValidationError {
  type: 'validation';
  message: string;
}

export type ValidationError = NetworkValidationError | ServerValidationError;

interface ValidationResult {
  validProducts: CustomFieldItems[];
  errors: ValidationError[];
}

export const validateProducts = async (
  products: CustomFieldItems[],
  destination: 'quote' | 'cart' = 'quote',
): Promise<ValidationResult> => {
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
        productName: productName || '',
      });
      return;
    }

    const { responseType, message } = result.value;

    switch (destination) {
      case 'cart':
        if (responseType === 'ERROR' || responseType === 'WARNING') {
          errors.push({
            type: 'validation',
            message,
          });
        }
        break;
      case 'quote':
      default:
        if (responseType === 'ERROR') {
          errors.push({
            type: 'validation',
            message,
          });
        }
        break;
    }
  });

  const validProducts = products.filter((_, index) => {
    const res = settledResults[index];

    switch (destination) {
      case 'cart':
        return res.status === 'fulfilled' && res.value.responseType === 'SUCCESS';
      case 'quote':
      default:
        return res.status === 'fulfilled' && res.value.responseType !== 'ERROR';
    }
  });

  return { validProducts, errors };
};
