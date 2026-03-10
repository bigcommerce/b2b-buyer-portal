import { describe, expect, it, vi } from 'vitest';

import { ProductsProps } from '@/utils/b3Product/shared/config';

import { calculateSubTotal, mapToProductsFailedArray, verifyInventory } from './b3ShoppingList';

vi.mock('@/utils/b3Product/b3Product', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/b3Product/b3Product')>();

  return {
    ...original,
    getBCPrice: vi.fn((basePrice: number) => basePrice),
  };
});

const buildProduct = (overrides: Partial<ProductsProps> = {}): ProductsProps => ({
  node: {
    productId: 1,
    productName: 'Test Product',
    variantSku: 'SKU-1',
    quantity: 1,
    basePrice: '10.00',
    taxPrice: '0',
    productsSearch: {
      inventoryTracking: 'none',
      availableToSell: 10,
      unlimitedBackorder: false,
      orderQuantityMinimum: 0,
      orderQuantityMaximum: 0,
    },
  },
  ...overrides,
});

describe('mapToProductsFailedArray', () => {
  it('sets isStock to "0" when inventoryTracking is none', () => {
    const result = mapToProductsFailedArray([{ product: buildProduct() }]);

    expect(result[0].isStock).toBe('0');
  });

  it('sets isStock to "1" when inventoryTracking is product', () => {
    const product = buildProduct();
    product.node.productsSearch.inventoryTracking = 'product';

    const result = mapToProductsFailedArray([{ product }]);

    expect(result[0].isStock).toBe('1');
  });

  it('uses availableToSell from validation error when provided', () => {
    const product = buildProduct();
    product.node.productsSearch.availableToSell = 10;

    const result = mapToProductsFailedArray([{ product, availableToSell: 3 }]);

    expect(result[0].stock).toBe(3);
  });

  it('falls back to productsSearch.availableToSell when not provided', () => {
    const product = buildProduct();
    product.node.productsSearch.availableToSell = 10;

    const result = mapToProductsFailedArray([{ product }]);

    expect(result[0].stock).toBe(10);
  });

  it('sets stock to Infinity when unlimitedBackorder is true', () => {
    const product = buildProduct();
    product.node.productsSearch.unlimitedBackorder = true;

    const result = mapToProductsFailedArray([{ product, availableToSell: 0 }]);

    expect(result[0].stock).toBe(Infinity);
  });

  it('maps min/max quantity from productsSearch', () => {
    const product = buildProduct();
    product.node.productsSearch.orderQuantityMinimum = 2;
    product.node.productsSearch.orderQuantityMaximum = 20;

    const result = mapToProductsFailedArray([{ product }]);

    expect(result[0].minQuantity).toBe(2);
    expect(result[0].maxQuantity).toBe(20);
  });
});

describe('calculateSubTotal', () => {
  it('returns 0 for an empty array', () => {
    expect(calculateSubTotal([])).toBe(0.0);
  });

  it('sums price * quantity across items', () => {
    const items = [
      { node: { quantity: 2, basePrice: '5.00', taxPrice: '0' } },
      { node: { quantity: 3, basePrice: '10.00', taxPrice: '0' } },
    ];

    // getBCPrice is mocked to return basePrice, so total = 2*5 + 3*10 = 40
    expect(calculateSubTotal(items)).toBe(40);
  });
});

describe('verifyInventory', () => {
  const buildInventoryInfo = (overrides = {}) => ({
    variantSku: 'SKU-1',
    isStock: '0',
    stock: 0,
    minQuantity: 0,
    maxQuantity: 0,
    ...overrides,
  });

  it('passes a product when inventory tracking is off', () => {
    const product = buildProduct();
    const inventoryInfo = buildInventoryInfo({ isStock: '0' });

    const { validateSuccessArr, validateFailureArr } = verifyInventory([product], [
      inventoryInfo,
    ] as unknown as ProductsProps[]);

    expect(validateSuccessArr).toHaveLength(1);
    expect(validateFailureArr).toHaveLength(0);
  });

  it('fails a product when quantity exceeds stock', () => {
    const product = buildProduct({ node: { ...buildProduct().node, quantity: 5 } });
    const inventoryInfo = buildInventoryInfo({ isStock: '1', stock: 3 });

    const { validateSuccessArr, validateFailureArr } = verifyInventory([product], [
      inventoryInfo,
    ] as unknown as ProductsProps[]);

    expect(validateSuccessArr).toHaveLength(0);
    expect(validateFailureArr).toHaveLength(1);
    expect(validateFailureArr[0].stock).toBe(3);
  });

  it('fails a product when quantity is below minimum', () => {
    const product = buildProduct({ node: { ...buildProduct().node, quantity: 1 } });
    const inventoryInfo = buildInventoryInfo({ minQuantity: 3 });

    const { validateSuccessArr, validateFailureArr } = verifyInventory([product], [
      inventoryInfo,
    ] as unknown as ProductsProps[]);

    expect(validateSuccessArr).toHaveLength(0);
    expect(validateFailureArr).toHaveLength(1);
  });

  it('fails a product when quantity exceeds maximum', () => {
    const product = buildProduct({ node: { ...buildProduct().node, quantity: 10 } });
    const inventoryInfo = buildInventoryInfo({ maxQuantity: 5 });

    const { validateSuccessArr, validateFailureArr } = verifyInventory([product], [
      inventoryInfo,
    ] as unknown as ProductsProps[]);

    expect(validateSuccessArr).toHaveLength(0);
    expect(validateFailureArr).toHaveLength(1);
  });

  it('passes a product within min/max bounds', () => {
    const product = buildProduct({ node: { ...buildProduct().node, quantity: 5 } });
    const inventoryInfo = buildInventoryInfo({ minQuantity: 2, maxQuantity: 10 });

    const { validateSuccessArr, validateFailureArr } = verifyInventory([product], [
      inventoryInfo,
    ] as unknown as ProductsProps[]);

    expect(validateSuccessArr).toHaveLength(1);
    expect(validateFailureArr).toHaveLength(0);
  });

  it('matches products to inventory by variantSku', () => {
    const product1 = buildProduct({
      node: { ...buildProduct().node, variantSku: 'SKU-1', quantity: 5 },
    });
    const product2 = buildProduct({
      node: { ...buildProduct().node, variantSku: 'SKU-2', quantity: 1 },
    });

    const inventoryInfos = [
      buildInventoryInfo({ variantSku: 'SKU-1', isStock: '1', stock: 3 }), // fails
      buildInventoryInfo({ variantSku: 'SKU-2', isStock: '1', stock: 10 }), // passes
    ];

    const { validateSuccessArr, validateFailureArr } = verifyInventory(
      [product1, product2],
      inventoryInfos as unknown as ProductsProps[],
    );

    expect(validateSuccessArr).toHaveLength(1);
    expect(validateFailureArr).toHaveLength(1);
  });
});
