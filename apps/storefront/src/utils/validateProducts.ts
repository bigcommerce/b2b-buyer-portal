import { validateProduct } from '@/shared/service/b2b/graphql/product';

interface Option {
  optionId: number | `attribute[${number}]`;
  optionValue: string;
}

interface NetworkValidationError {
  type: 'network';
  errorCode: 'NETWORK_ERROR';
}

interface ServerValidationError {
  type: 'validation';
  errorCode: 'NON_PURCHASABLE' | 'OOS' | 'INVALID_FIELDS' | 'OTHER';
  message: string;
}

type ValidationError = NetworkValidationError | ServerValidationError;

interface Product {
  productId: number;
  variantId: number;
  quantity: number;
  productOptions: Option[];
}

interface ValidatedProductSuccess<T> {
  status: 'success';
  product: T;
}

export interface ValidatedProductWarning<T> {
  status: 'warning';
  message: string;
  product: T;
}

export interface ValidatedProductError<T> {
  status: 'error';
  error: ValidationError;
  product: T;
}

type ValidatedProduct<T> =
  | ValidatedProductSuccess<T>
  | ValidatedProductWarning<T>
  | ValidatedProductError<T>;

interface ValidateProductsResult<T> {
  success: ValidatedProductSuccess<T>[];
  warning: ValidatedProductWarning<T>[];
  error: ValidatedProductError<T>[];
}

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

const isProduct = (input: ValidateProductsInput): input is Product => {
  if (typeof input !== 'object' || input === null) return false;

  return (
    'productId' in input && 'variantId' in input && 'quantity' in input && 'productOptions' in input
  );
};

const transformProductOptions = (option: Option) => {
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
};

const transformProductForValidation = (product: ValidateProductsInput): Product => {
  if ('node' in product && product.node?.productsSearch) {
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

  if (
    'productId' in product &&
    'variantId' in product &&
    !('productOptions' in product) &&
    'productsSearch' in product
  ) {
    const options =
      product.productsSearch?.newSelectOptionList || product.productsSearch?.selectedOptions || [];

    return {
      productId: Number(product.productId),
      variantId: Number(product.productsSearch?.variantId || product.variantId),
      quantity: Number(product.quantity),
      productOptions: options.map((opt: any) => ({
        optionId: opt.optionId,
        optionValue: String(opt.optionValue),
      })),
    };
  }

  if (isProduct(product)) {
    return {
      productId: Number(product.productId),
      variantId: Number(product.variantId),
      quantity: Number(product.quantity),
      productOptions: product.productOptions || [],
    };
  }

  throw new Error('Unsupported product shape provided to validateProducts');
};

function mapToValidateProducts<T extends ValidateProductsInput>(product: T) {
  const { productId, variantId, quantity, productOptions } = transformProductForValidation(product);

  return {
    productId,
    variantId,
    quantity,
    productOptions: productOptions.map(transformProductOptions),
  };
}

export const validateProducts = async <T extends ValidateProductsInput>(
  products: T[],
): Promise<ValidateProductsResult<T>> => {
  const results = await Promise.allSettled(
    products.map(mapToValidateProducts).map(validateProduct),
  );

  const validatedProducts = products.map<ValidatedProduct<T>>((product, index) => {
    const res = results[index];

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
