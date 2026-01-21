import { graphql, HttpResponse, startMockServer } from 'tests/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { when } from 'vitest-when';

import {
  convertStockAndThresholdValidationErrorToWarning,
  validateProducts,
} from './validateProducts';

const { server } = startMockServer();

type ThresholdValidationInput = Parameters<
  typeof convertStockAndThresholdValidationErrorToWarning
>[0];

const buildValidatedProductsFixture = () => {
  const buildProduct = (id: number, name: string) => ({
    productId: id,
    variantId: id + 100,
    quantity: 1,
    name,
    productOptions: [],
  });

  const products = {
    success: buildProduct(1, 'Normal product'),
    warning: buildProduct(2, 'Warning product'),
    minimumThreshold: buildProduct(3, 'Minimum Threshold Product'),
    maximumThreshold: buildProduct(4, 'Maximum Threshold Product'),
    nonThreshold: buildProduct(5, 'Non Threshold Product'),
    stock: buildProduct(6, 'Stock error product'),
    network: buildProduct(7, 'Network error product'),
  };

  const minimumThresholdMessage = `You need to purchase a minimum of 5 of the ${products.minimumThreshold.name} per order.`;
  const maximumThresholdMessage = `You can only purchase a maximum of 10 of the ${products.maximumThreshold.name} per order.`;

  const validatedProducts: ThresholdValidationInput = {
    success: [{ status: 'success', product: products.success }],
    warning: [{ status: 'warning', message: 'Existing warning', product: products.warning }],
    error: [
      {
        status: 'error',
        error: {
          type: 'validation',
          message: minimumThresholdMessage,
          errorCode: 'OTHER',
          availableToSell: 4,
        },
        product: products.minimumThreshold,
      },
      {
        status: 'error',
        error: {
          type: 'validation',
          message: maximumThresholdMessage,
          errorCode: 'OTHER',
          availableToSell: 10,
        },
        product: products.maximumThreshold,
      },
      {
        status: 'error',
        error: {
          type: 'validation',
          message: 'Not purchasable for this account.',
          errorCode: 'NON_PURCHASABLE',
          availableToSell: 0,
        },
        product: products.nonThreshold,
      },
      {
        status: 'error',
        error: {
          type: 'validation',
          message: 'Out of stock.',
          errorCode: 'OOS',
          availableToSell: 0,
        },
        product: products.stock,
      },
      {
        status: 'error',
        error: { type: 'network', errorCode: 'NETWORK_ERROR' },
        product: products.network,
      },
    ],
  };

  return { validatedProducts, products };
};

it('standardizes products and preserves the original payload', async () => {
  const validateProduct = vi.fn();

  when(validateProduct)
    .calledWith({
      productId: 1,
      variantId: 3,
      quantity: 2,
      productOptions: [{ optionId: 5, optionValue: 'Red' }],
    })
    .thenReturn({ data: { validateProduct: { responseType: 'SUCCESS', message: '' } } });

  when(validateProduct)
    .calledWith({
      productId: 10,
      variantId: 12,
      quantity: 4,
      productOptions: [{ optionId: 6, optionValue: 'Blue' }],
    })
    .thenReturn({ data: { validateProduct: { responseType: 'SUCCESS', message: '' } } });

  when(validateProduct)
    .calledWith({
      productId: 20,
      variantId: 21,
      quantity: 5,
      productOptions: [{ optionId: 7, optionValue: 'Green' }],
    })
    .thenReturn({ data: { validateProduct: { responseType: 'SUCCESS', message: '' } } });

  server.use(
    graphql.query('ValidateProduct', ({ variables }) =>
      HttpResponse.json(validateProduct(variables)),
    ),
  );

  const graphQlNodeProduct = {
    node: {
      productId: 1,
      quantity: 2,
      extraInfo: 'bar',
      productsSearch: {
        variantId: 3,
        newSelectOptionList: [{ optionId: 'attribute[5]', optionValue: 'Red' }],
      },
    },
  };

  const productWithProductsSearch = {
    productId: 10,
    variantId: 11,
    quantity: 4,
    someMoreInfo: 'baz',
    productsSearch: {
      variantId: 12,
      selectedOptions: [{ optionId: 'attribute[6]', optionValue: 'Blue' }],
    },
  };

  const plainProduct = {
    productId: 20,
    variantId: 21,
    quantity: 5,
    otherInfo: 'qux',
    productOptions: [{ optionId: 'attribute[7]', optionValue: 'Green' }],
  };

  const result = await validateProducts([
    graphQlNodeProduct,
    productWithProductsSearch,
    plainProduct,
  ]);

  expect(result).toEqual({
    success: [
      { status: 'success', product: graphQlNodeProduct },
      { status: 'success', product: productWithProductsSearch },
      { status: 'success', product: plainProduct },
    ],
    warning: [],
    error: [],
  });
});

it('groups products by their validation status', async () => {
  const validateProduct = vi.fn();

  const products = [
    { variantId: 199, quantity: 1, productOptions: [], productId: 99, extraInfo: 'foo' },
    { variantId: 199, quantity: 1, productOptions: [], productId: 100, extraInfo: 'bar' },
    { variantId: 199, quantity: 1, productOptions: [], productId: 101, extraInfo: 'baz' },
    { variantId: 199, quantity: 1, productOptions: [], productId: 102, extraInfo: 'qux' },
  ];

  when(validateProduct)
    .calledWith({ productId: 99, variantId: 199, quantity: 1, productOptions: [] })
    .thenReturn({ data: { validateProduct: { responseType: 'SUCCESS', message: '' } } });
  when(validateProduct)
    .calledWith({ productId: 100, variantId: 199, quantity: 1, productOptions: [] })
    .thenReturn({ data: { validateProduct: { responseType: 'WARNING', message: 'baz qux' } } });
  when(validateProduct)
    .calledWith({ productId: 101, variantId: 199, quantity: 1, productOptions: [] })
    .thenReturn({
      data: {
        validateProduct: {
          responseType: 'ERROR',
          message: 'foo bar',
          errorCode: 'OTHER',
          product: { availableToSell: 12 },
        },
      },
    });
  when(validateProduct)
    .calledWith({ productId: 102, variantId: 199, quantity: 1, productOptions: [] })
    .thenReject(new Error('network failure'));

  server.use(
    graphql.query('ValidateProduct', ({ variables }) =>
      HttpResponse.json(validateProduct(variables)),
    ),
  );

  const result = await validateProducts(products);

  expect(result).toEqual({
    success: [{ status: 'success', product: products[0] }],
    warning: [{ status: 'warning', message: 'baz qux', product: products[1] }],
    error: [
      {
        status: 'error',
        error: { type: 'validation', message: 'foo bar', errorCode: 'OTHER', availableToSell: 12 },
        product: products[2],
      },
      {
        status: 'error',
        error: { type: 'network', errorCode: 'NETWORK_ERROR' },
        product: products[3],
      },
    ],
  });
});

// This is here until TS can handle the type correctly
it('throws an error if the product shape is not valid', async () => {
  await expect(() =>
    validateProducts([{ productId: 1, variantId: 1, quantity: 1 }]),
  ).rejects.toThrow('Unsupported product shape provided to validateProducts');
});

describe('convertStockAndThresholdValidationErrorToWarning', () => {
  it('converts threshold and stock errors to warnings', () => {
    const { validatedProducts, products } = buildValidatedProductsFixture();
    const minimumThresholdMessage = `You need to purchase a minimum of 5 of the ${products.minimumThreshold.name} per order.`;
    const maximumThresholdMessage = `You can only purchase a maximum of 10 of the ${products.maximumThreshold.name} per order.`;

    const result = convertStockAndThresholdValidationErrorToWarning(validatedProducts);

    expect(result.warning).toEqual([
      { status: 'warning', message: 'Existing warning', product: products.warning },
      {
        status: 'warning',
        message: minimumThresholdMessage,
        product: products.minimumThreshold,
      },
      {
        status: 'warning',
        message: maximumThresholdMessage,
        product: products.maximumThreshold,
      },
      {
        status: 'warning',
        message: 'Out of stock.',
        product: products.stock,
      },
    ]);
  });

  it('keeps non-threshold validation and network errors as errors', () => {
    const { validatedProducts, products } = buildValidatedProductsFixture();

    const result = convertStockAndThresholdValidationErrorToWarning(validatedProducts);

    expect(result.success).toEqual([{ status: 'success', product: products.success }]);
    expect(result.error).toEqual([
      {
        status: 'error',
        error: {
          type: 'validation',
          message: 'Not purchasable for this account.',
          errorCode: 'NON_PURCHASABLE',
          availableToSell: 0,
        },
        product: products.nonThreshold,
      },
      {
        status: 'error',
        error: { type: 'network', errorCode: 'NETWORK_ERROR' },
        product: products.network,
      },
    ]);
  });

  it('returns empty groups when no validations are provided', () => {
    const result = convertStockAndThresholdValidationErrorToWarning({
      success: [],
      warning: [],
      error: [],
    });

    expect(result).toEqual({
      success: [],
      warning: [],
      error: [],
    });
  });
});
