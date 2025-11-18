import { validateProduct } from '@/shared/service/b2b/graphql/product';

interface Option {
  optionId: number | `attribute[${number}]`;
  optionValue: string;
}

interface NetworkValidationError {
  type: 'network';
}

interface ServerValidationError {
  type: 'validation';
  message: string;
}

type ValidationError = NetworkValidationError | ServerValidationError;

export interface Product {
  productId: number;
  variantId: number;
  quantity: number;
  productOptions: Option[];
}

interface ValidatedProductSuccess<T = any> {
  status: 'success';
  product: T;
}

export interface ValidatedProductWarning<T = any> {
  status: 'warning';
  message: string;
  product: T;
}

export interface ValidatedProductError<T = any> {
  status: 'error';
  error: ValidationError;
  product: T;
}

type ValidatedProduct<T> =
  | ValidatedProductSuccess<T>
  | ValidatedProductWarning<T>
  | ValidatedProductError<T>;

export interface ValidateProductsResult<T> {
  success: ValidatedProductSuccess<T>[];
  warning: ValidatedProductWarning<T>[];
  error: ValidatedProductError<T>[];
}

const transformProductOptions = (options: Option[]) => {
  return options.map((option) => {
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
};

const transformProductForValidation = (product: any): Product => {
  if (product.node && product.node.productsSearch) {
    const { node } = product;
    const { productsSearch } = node;
    const options = productsSearch.newSelectOptionList || productsSearch.selectedOptions || [];

    return {
      productId: Number(node.productId),
      variantId: Number(productsSearch.variantId),
      quantity: Number(node.quantity),
      productOptions: options.map((opt: any) => ({
        optionId: opt.optionId,
        optionValue: String(opt.optionValue),
      })),
    };
  }

  if (product.productId && product.variantId && !product.productOptions) {
    if (product.productsSearch) {
      const options =
        product.productsSearch.newSelectOptionList || product.productsSearch.selectedOptions || [];
      return {
        productId: Number(product.productId),
        variantId: Number(product.productsSearch.variantId || product.variantId),
        quantity: Number(product.quantity),
        productOptions: options.map((opt: any) => ({
          optionId: opt.optionId,
          optionValue: String(opt.optionValue),
        })),
      };
    }
  }

  return {
    productId: Number(product.productId),
    variantId: Number(product.variantId),
    quantity: Number(product.quantity),
    productOptions: product.productOptions || [],
  };
};

// represent all accepted input formats
type ValidateProductsInput =
  | Product
  | {
      node: {
        productId: number;
        quantity: number;
        productsSearch: { variantId: number; newSelectOptionList?: any[]; selectedOptions?: any[] };
      };
    }
  | {
      productId: number;
      variantId: number;
      quantity: number;
      productsSearch?: { variantId: number; newSelectOptionList?: any[]; selectedOptions?: any[] };
    }
  | CustomFieldItems;

export const validateProducts = async <T extends ValidateProductsInput = any>(
  products: T[],
): Promise<ValidateProductsResult<T>> => {
  const productsForValidation = products.map(transformProductForValidation);

  const validationPromises = productsForValidation.map((product) => {
    const productOptions = transformProductOptions(product.productOptions);

    return validateProduct({
      productId: Number(product.productId),
      variantId: Number(product.variantId),
      quantity: Number(product.quantity),
      productOptions,
    });
  });

  const settledResults = await Promise.allSettled(validationPromises);

  const validatedProducts = products.map<ValidatedProduct<T>>((product, index) => {
    const res = settledResults[index];

    if (res.status === 'rejected') {
      return {
        status: 'error',
        error: {
          type: 'network',
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
    success: validatedProducts.filter(
      (product): product is ValidatedProductSuccess<T> => product.status === 'success',
    ),
    warning: validatedProducts.filter(
      (product): product is ValidatedProductWarning<T> => product.status === 'warning',
    ),
    error: validatedProducts.filter(
      (product): product is ValidatedProductError<T> => product.status === 'error',
    ),
  };
};
