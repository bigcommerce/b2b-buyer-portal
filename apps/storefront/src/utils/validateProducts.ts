import { validateProduct } from '@/shared/service/b2b/graphql/product';

interface Option {
  optionId: number | `attribute[${number}]`;
  optionValue: string;
}

interface ValidatedProductSuccess {
  status: 'success';
  product: CustomFieldItems;
}

interface ValidatedProductWarning {
  status: 'warning';
  message: string;
  product: CustomFieldItems;
}

interface ValidatedProductServerError {
  status: 'error';
  error: {
    type: 'validation';
    errorCode: 'NON_PURCHASABLE' | 'OOS' | 'INVALID_FIELDS' | 'OTHER';
    message: string;
    availableToSell: number;
  };
  product: CustomFieldItems;
}

interface ValidatedProductNetworkError {
  status: 'error';
  error: {
    type: 'network';
    errorCode: 'NETWORK_ERROR';
  };
  product: CustomFieldItems;
}

export type ValidatedProductError = ValidatedProductServerError | ValidatedProductNetworkError;

type ValidatedProduct = ValidatedProductSuccess | ValidatedProductWarning | ValidatedProductError;

interface ValidateProductsResult {
  success: ValidatedProductSuccess[];
  warning: ValidatedProductWarning[];
  error: ValidatedProductError[];
}

const transformProductListToBeCompatibleWithValidateProducts = (products: CustomFieldItems[]) => {
  return products.map((product) => {
    if ('node' in product) {
      return {
        ...product.node,
        productsSearch: {
          ...product.node.productsSearch,
          selectedOptions: product.node.productsSearch.newSelectOptionList,
        },
      };
    }
    return {
      ...product,
      productsSearch: {
        ...product.productsSearch,
        selectedOptions: product.options,
        variantId: product.variantId,
      },
    };
  });
};

export const validateProducts = async (
  products: CustomFieldItems[],
): Promise<ValidateProductsResult> => {
  const productsList = transformProductListToBeCompatibleWithValidateProducts(products);

  const validationPromises = productsList.map((product) => {
    const { productId, quantity, productsSearch } = product;

    const { variantId, selectedOptions } = productsSearch;

    const productOptions = selectedOptions.map((option: Option) => {
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

  const validatedProducts = products.map<ValidatedProduct>((product, index) => {
    const res = settledResults[index];

    if (res.status === 'rejected') {
      return {
        status: 'error',
        error: {
          type: 'network',
          errorCode: 'NETWORK_ERROR',
        },
        product,
      };
    }

    switch (res.value.responseType) {
      case 'ERROR':
        return {
          status: 'error',
          error: {
            type: 'validation',
            message: res.value.message,
            errorCode: res.value.errorCode,
            availableToSell: res.value.product.availableToSell,
          },
          product,
        };
      case 'WARNING':
        return {
          status: 'warning',
          message: res.value.message,
          product,
        };
      case 'SUCCESS':
      default:
        return {
          status: 'success',
          product,
        };
    }
  });

  return {
    success: validatedProducts.filter((product) => product.status === 'success'),
    warning: validatedProducts.filter((product) => product.status === 'warning'),
    error: validatedProducts.filter((product) => product.status === 'error'),
  };
};
