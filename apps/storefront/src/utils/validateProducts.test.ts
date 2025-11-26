import { beforeEach, expect, it, vi } from 'vitest';

import { validateProduct } from '@/shared/service/b2b/graphql/product';

import { validateProducts } from './validateProducts';

vi.mock('@/shared/service/b2b/graphql/product', () => ({
  validateProduct: vi.fn(),
}));

const mockedValidateProduct = vi.mocked(validateProduct);

beforeEach(() => {
  mockedValidateProduct.mockReset();
});

it('standardizes products and preserves the original payload', async () => {
  const graphQlNodeProduct = {
    node: {
      productId: 1,
      quantity: 2,
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
    productsSearch: {
      variantId: 12,
      selectedOptions: [{ optionId: 'attribute[6]', optionValue: 'Blue' }],
    },
  };

  const plainProduct = {
    productId: 20,
    variantId: 21,
    quantity: 5,
    productOptions: [{ optionId: 'attribute[7]', optionValue: 'Green' }],
  };

  mockedValidateProduct.mockResolvedValue({
    responseType: 'SUCCESS',
    message: '',
  });

  const result = await validateProducts([
    graphQlNodeProduct,
    productWithProductsSearch,
    plainProduct,
  ]);

  expect(mockedValidateProduct).toHaveBeenCalledTimes(3);
  expect(mockedValidateProduct).toHaveBeenNthCalledWith(1, {
    productId: 1,
    variantId: 3,
    quantity: 2,
    productOptions: [{ optionId: 5, optionValue: 'Red' }],
  });
  expect(mockedValidateProduct).toHaveBeenNthCalledWith(2, {
    productId: 10,
    variantId: 12,
    quantity: 4,
    productOptions: [{ optionId: 6, optionValue: 'Blue' }],
  });
  expect(mockedValidateProduct).toHaveBeenNthCalledWith(3, {
    productId: 20,
    variantId: 21,
    quantity: 5,
    productOptions: [{ optionId: 7, optionValue: 'Green' }],
  });

  expect(result.success).toHaveLength(3);
  expect(result.success[0].product).toBe(graphQlNodeProduct);
  expect(result.success[1].product).toBe(productWithProductsSearch);
  expect(result.success[2].product).toBe(plainProduct);
});

it('groups products by their validation status', async () => {
  const baseProduct = {
    productId: 99,
    variantId: 199,
    quantity: 1,
    productOptions: [],
  };
  const products = [
    baseProduct,
    { ...baseProduct, productId: 100 },
    { ...baseProduct, productId: 101 },
    { ...baseProduct, productId: 102 },
  ];

  mockedValidateProduct
    .mockResolvedValueOnce({ responseType: 'SUCCESS', message: '' })
    .mockResolvedValueOnce({ responseType: 'WARNING', message: 'warn' })
    .mockResolvedValueOnce({ responseType: 'ERROR', message: 'error' })
    .mockRejectedValueOnce(new Error('network failure'));

  const result = await validateProducts(products);

  expect(result.success).toHaveLength(1);
  expect(result.warning).toHaveLength(1);
  expect(result.warning[0].message).toBe('warn');

  expect(result.error).toHaveLength(2);
  expect(result.error[0].error).toEqual({
    type: 'validation',
    message: 'error',
  });
  expect(result.error[1].error.type).toBe('network');
  expect(result.error[1].product.productId).toBe(102);
});
