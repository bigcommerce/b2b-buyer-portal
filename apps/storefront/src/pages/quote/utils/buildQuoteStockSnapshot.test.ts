import { describe, expect, it } from 'vitest';

import { buildQuoteStockSnapshot } from './buildQuoteStockSnapshot';

describe('buildQuoteStockSnapshot', () => {
  it('extracts totalOnHand from productsSearch for product-level tracking', () => {
    const result = buildQuoteStockSnapshot([
      {
        id: 'line-1',
        productId: 1,
        variantId: 10,
        variantSku: 'SKU-1',
        quantity: 5,
        productsSearch: { inventoryTracking: 'product', totalOnHand: 7 },
      },
    ]);

    expect(result).toEqual([
      {
        lineId: 'line-1',
        productId: 1,
        variantId: 10,
        variantSku: 'SKU-1',
        quantity: 5,
        inventoryTracking: 'product',
        totalOnHand: 7,
      },
    ]);
  });

  it('looks up variant by SKU for variant-level tracking', () => {
    const result = buildQuoteStockSnapshot([
      {
        id: 'line-2',
        productId: 2,
        variantId: 22,
        variantSku: 'SKU-V',
        quantity: 3,
        productsSearch: {
          inventoryTracking: 'variant',
          variants: [
            { sku: 'SKU-X', total_on_hand: 99 },
            { sku: 'SKU-V', total_on_hand: 2 },
          ],
        },
      },
    ]);

    expect(result[0].totalOnHand).toBe(2);
  });

  it('returns totalOnHand null when variant not found', () => {
    const result = buildQuoteStockSnapshot([
      {
        id: 'line-3',
        productId: 3,
        variantId: 33,
        variantSku: 'MISSING',
        quantity: 1,
        productsSearch: {
          inventoryTracking: 'variant',
          variants: [{ sku: 'OTHER', total_on_hand: 5 }],
        },
      },
    ]);

    expect(result[0].totalOnHand).toBeNull();
  });

  it('marks inventoryTracking unknown when productsSearch is missing', () => {
    const result = buildQuoteStockSnapshot([
      { id: 'line-4', productId: 4, variantId: 44, quantity: 2 },
    ]);

    expect(result[0].inventoryTracking).toBe('unknown');
    expect(result[0].totalOnHand).toBeNull();
  });

  it('marks inventoryTracking none when productsSearch is present but tracking is none', () => {
    const result = buildQuoteStockSnapshot([
      {
        id: 'line-5a',
        productId: 5,
        variantId: 50,
        quantity: 1,
        productsSearch: { inventoryTracking: 'none' },
      },
    ]);

    expect(result[0].inventoryTracking).toBe('none');
  });

  it('marks inventoryTracking unknown for an unexpected tracking value (fail safe)', () => {
    const result = buildQuoteStockSnapshot([
      {
        id: 'line-5b',
        productId: 5,
        variantId: 50,
        quantity: 1,
        productsSearch: { inventoryTracking: 'multi-location' },
      },
    ]);

    expect(result[0].inventoryTracking).toBe('unknown');
  });

  it('coerces string quantity to number', () => {
    const result = buildQuoteStockSnapshot([
      {
        id: 'line-5b',
        productId: 5,
        variantId: 55,
        quantity: '7',
        productsSearch: { inventoryTracking: 'product', totalOnHand: 10 },
      },
    ]);

    expect(result[0].quantity).toBe(7);
  });

  it('falls back to lineItem.sku when variantSku is an empty string', () => {
    // Some upstream shapes type variantSku as required `string` and may initialize it to "" rather
    // than leaving it undefined — || (not ??) is needed for the fallback to engage.
    const result = buildQuoteStockSnapshot([
      {
        productId: 114,
        variantId: 82,
        variantSku: '',
        sku: 'VGI-BL',
        quantity: 2,
        productsSearch: {
          inventoryTracking: 'variant',
          variants: [
            { sku: 'VGI-RE', total_on_hand: 2 },
            { sku: 'VGI-BL', total_on_hand: 1 },
          ],
        },
      },
    ]);

    expect(result[0].variantSku).toBe('VGI-BL');
    expect(result[0].totalOnHand).toBe(1);
  });

  it('falls back to lineItem.sku when variantSku is missing (real quote-line shape)', () => {
    // Real quote-line items do not carry a `variantSku` field — the variant SKU lives on `sku`.
    const result = buildQuoteStockSnapshot([
      {
        productId: 114,
        variantId: 82,
        sku: 'VGI-BL',
        quantity: 2,
        productsSearch: {
          inventoryTracking: 'variant',
          variants: [
            { sku: 'VGI-RE', total_on_hand: 2 },
            { sku: 'VGI-GR', total_on_hand: 2 },
            { sku: 'VGI-BL', total_on_hand: 1 },
          ],
        },
      },
    ]);

    expect(result[0].variantSku).toBe('VGI-BL');
    expect(result[0].totalOnHand).toBe(1);
  });

  it('prefers variantSku over sku when both are present', () => {
    const result = buildQuoteStockSnapshot([
      {
        productId: 1,
        variantId: 10,
        variantSku: 'EXPLICIT',
        sku: 'FALLBACK',
        quantity: 1,
        productsSearch: { inventoryTracking: 'none' },
      },
    ]);

    expect(result[0].variantSku).toBe('EXPLICIT');
  });

  it('synthesizes lineId from variantId and index when id is missing', () => {
    const result = buildQuoteStockSnapshot([
      { productId: 1, variantId: 10, quantity: 1 },
      { productId: 1, variantId: 10, quantity: 1 },
    ]);

    expect(result[0].lineId).toBe('10::0');
    expect(result[1].lineId).toBe('10::1');
  });

  it('coerces string productId to number', () => {
    // Real quote-line items carry productId as a string.
    const result = buildQuoteStockSnapshot([{ productId: '114', variantId: 82, quantity: 1 }]);

    expect(result[0].productId).toBe(114);
  });
});
