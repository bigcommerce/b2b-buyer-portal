import { describe, expect, it } from 'vitest';

import type { QuoteItem } from '@/types/quotes';

import {
  draftRowQuantityExceedsAvailableToSell,
  getDraftBackorderDisplayFields,
  getQuoteItemBackendAvailability,
} from './getDraftBackorderDisplayFields';

type QuoteLineNode = QuoteItem['node'];

describe('getDraftBackorderDisplayFields', () => {
  it('returns null when inventory tracking is none', () => {
    const row = {
      quantity: 5,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'none',
        totalOnHand: 2,
      },
    } as QuoteLineNode;

    expect(getDraftBackorderDisplayFields(row)).toBeNull();
  });

  it('uses product-level totalOnHand and message for product tracking', () => {
    const row = {
      quantity: 10,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'product',
        totalOnHand: 3,
        backorderMessage: 'Restock soon',
        unlimitedBackorder: false,
      },
    } as QuoteLineNode;

    expect(getDraftBackorderDisplayFields(row)).toEqual({
      totalOnHand: 3,
      backorderMessage: 'Restock soon',
      quantityBackordered: 7,
    });
  });

  it('uses variant-level fields for variant tracking', () => {
    const row = {
      quantity: 4,
      variantSku: 'SKU-B',
      productsSearch: {
        inventoryTracking: 'variant',
        variants: [
          { sku: 'SKU-A', total_on_hand: 100, backorder_message: 'A' },
          { sku: 'SKU-B', total_on_hand: 1, backorder_message: 'B msg' },
        ],
      },
    } as QuoteLineNode;

    expect(getDraftBackorderDisplayFields(row)).toEqual({
      totalOnHand: 1,
      backorderMessage: 'B msg',
      quantityBackordered: 3,
    });
  });

  it('returns null when variant tracking but line sku is not in variants list', () => {
    const row = {
      quantity: 4,
      variantSku: 'MISSING-SKU',
      productsSearch: {
        inventoryTracking: 'variant',
        variants: [{ sku: 'SKU-A', total_on_hand: 100, backorder_message: 'A' }],
      },
    } as QuoteLineNode;

    expect(getDraftBackorderDisplayFields(row)).toBeNull();
  });

  it('returns null when ordered quantity does not exceed on hand', () => {
    const row = {
      quantity: 2,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'product',
        totalOnHand: 5,
      },
    } as QuoteLineNode;

    expect(getDraftBackorderDisplayFields(row)).toBeNull();
  });
});

describe('getQuoteItemBackendAvailability', () => {
  it('returns null when inventory tracking is none', () => {
    const row = {
      quantity: 10,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'none' as const,
        availableToSell: 0,
        unlimitedBackorder: false,
      },
    } as QuoteLineNode;

    expect(getQuoteItemBackendAvailability(row)).toBeNull();
  });

  it('matches draftRowQuantityExceedsAvailableToSell for product tracking', () => {
    const row = {
      quantity: 10,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'product',
        availableToSell: 4,
        unlimitedBackorder: false,
      },
    } as QuoteLineNode;

    const quoteItemBackendAvailability = getQuoteItemBackendAvailability(row);
    expect(quoteItemBackendAvailability).toEqual({
      exceedsAvailableToSell: true,
      availableToSell: 4,
    });
    expect(draftRowQuantityExceedsAvailableToSell(row)).toBe(
      quoteItemBackendAvailability?.exceedsAvailableToSell,
    );
  });
});

describe('draftRowQuantityExceedsAvailableToSell', () => {
  it('is true when quantity is greater than availableToSell without unlimited backorder (product)', () => {
    const row = {
      quantity: 10,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'product',
        availableToSell: 4,
        unlimitedBackorder: false,
      },
    } as QuoteLineNode;

    expect(draftRowQuantityExceedsAvailableToSell(row)).toBe(true);
  });

  it('is false when quantity is within availableToSell', () => {
    const row = {
      quantity: 3,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'product',
        availableToSell: 10,
        unlimitedBackorder: false,
      },
    } as QuoteLineNode;

    expect(draftRowQuantityExceedsAvailableToSell(row)).toBe(false);
  });

  it('is false when unlimited backorder even if qty exceeds ATS', () => {
    const row = {
      quantity: 100,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'product',
        availableToSell: 2,
        unlimitedBackorder: true,
      },
    } as QuoteLineNode;

    expect(draftRowQuantityExceedsAvailableToSell(row)).toBe(false);
  });

  it('uses variant available_to_sell for variant tracking', () => {
    const row = {
      quantity: 5,
      variantSku: 'SKU-B',
      productsSearch: {
        inventoryTracking: 'variant',
        variants: [
          { sku: 'SKU-A', available_to_sell: 99, unlimited_backorder: false },
          { sku: 'SKU-B', available_to_sell: 2, unlimited_backorder: false },
        ],
      },
    } as QuoteLineNode;

    expect(draftRowQuantityExceedsAvailableToSell(row)).toBe(true);
  });
});
