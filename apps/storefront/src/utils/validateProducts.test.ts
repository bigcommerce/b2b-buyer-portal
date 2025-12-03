import { graphql, HttpResponse, startMockServer } from 'tests/test-utils';
import { expect, it, vi } from 'vitest';
import { when } from 'vitest-when';

import { validateProducts } from './validateProducts';

const { server } = startMockServer();

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
    .thenReturn({ data: { validateProduct: { responseType: 'ERROR', message: 'foo bar' } } });
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
      { status: 'error', error: { type: 'validation', message: 'foo bar' }, product: products[2] },
      { status: 'error', error: { type: 'network' }, product: products[3] },
    ],
  });
});

// This is here until TS can handle the type correctly
it('throws an error if the product shape is not valid', async () => {
  await expect(() =>
    validateProducts([{ productId: 1, variantId: 1, quantity: 1 }]),
  ).rejects.toThrow('Unsupported product shape provided to validateProducts');
});
