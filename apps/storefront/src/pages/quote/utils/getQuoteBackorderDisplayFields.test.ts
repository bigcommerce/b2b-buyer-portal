import { describe, expect, it } from 'vitest';

import type { QuoteItem } from '@/types/quotes';

import {
  draftQuoteListHasBackorderedItemsForDisplay,
  draftRowQuantityExceedsAvailableToSell,
  getDraftBackorderDisplayFields,
  getQuoteBackorderDisplayFields,
  getQuoteBackorderDisplayQuantity,
  getQuoteItemBackendAvailability,
  getQuotePicklistSelections,
  getRowPicklistBackorderSnapshot,
  type QuoteBackorderRow,
  quoteDetailListHasBackorderedItemsForDisplay,
  quoteDetailListHasPicklistSnapshotBackordered,
} from './getQuoteBackorderDisplayFields';

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

  it('returns null when product totalOnHand is missing from inventory lookup', () => {
    const row = {
      quantity: 10,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'product',
        availableToSell: 10,
        unlimitedBackorder: false,
      },
    } as QuoteLineNode;

    expect(getDraftBackorderDisplayFields(row)).toBeNull();
  });

  it('returns null when variant total_on_hand is missing from inventory lookup', () => {
    const row = {
      quantity: 4,
      variantSku: 'SKU-B',
      productsSearch: {
        inventoryTracking: 'variant',
        variants: [{ sku: 'SKU-B', backorder_message: 'B msg' }],
      },
    } as QuoteLineNode;

    expect(getDraftBackorderDisplayFields(row)).toBeNull();
  });

  it('caps backorder quantity at available-to-sell when qty exceeds ATS', () => {
    const row = {
      quantity: 100,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'product',
        totalOnHand: 3,
        availableToSell: 4,
        backorderMessage: '2-4 weeks',
        unlimitedBackorder: false,
      },
    } as QuoteLineNode;

    expect(getDraftBackorderDisplayFields(row)).toEqual({
      totalOnHand: 3,
      backorderMessage: '2-4 weeks',
      quantityBackordered: 1,
    });
  });

  it('does not increase backorder quantity when qty increases beyond ATS', () => {
    const baseRow = {
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'product',
        totalOnHand: 3,
        availableToSell: 4,
        backorderMessage: '2-4 weeks',
        unlimitedBackorder: false,
      },
    };

    const atLimit = getDraftBackorderDisplayFields({ ...baseRow, quantity: 10 } as QuoteLineNode);
    const beyondLimit = getDraftBackorderDisplayFields({
      ...baseRow,
      quantity: 100,
    } as QuoteLineNode);

    expect(atLimit).toEqual(beyondLimit);
  });
});

describe('getQuoteBackorderDisplayQuantity', () => {
  it('caps at available-to-sell when qty exceeds ATS', () => {
    const row = {
      quantity: 100,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'product',
        availableToSell: 4,
        unlimitedBackorder: false,
      },
    } as QuoteLineNode;

    expect(getQuoteBackorderDisplayQuantity(row)).toBe(4);
  });

  it('returns full qty when within available-to-sell', () => {
    const row = {
      quantity: 7,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'product',
        availableToSell: 10,
        unlimitedBackorder: false,
      },
    } as QuoteLineNode;

    expect(getQuoteBackorderDisplayQuantity(row)).toBe(7);
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

describe('draftQuoteListHasBackorderedItemsForDisplay', () => {
  it('returns false for an empty list', () => {
    expect(draftQuoteListHasBackorderedItemsForDisplay([])).toBe(false);
  });

  it('returns true when an item has backorder fields and quantity is within available-to-sell', () => {
    const row = {
      quantity: 10,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'product',
        totalOnHand: 3,
        availableToSell: 10,
        unlimitedBackorder: false,
      },
    } as QuoteLineNode;

    expect(draftQuoteListHasBackorderedItemsForDisplay([{ node: row }] as QuoteItem[])).toBe(true);
  });

  it('returns false when ordered quantity is within total on hand (no backordered quantity)', () => {
    const row = {
      quantity: 2,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'product',
        totalOnHand: 5,
        availableToSell: 10,
        unlimitedBackorder: false,
      },
    } as QuoteLineNode;

    expect(draftQuoteListHasBackorderedItemsForDisplay([{ node: row }] as QuoteItem[])).toBe(false);
  });

  it('returns true when quantity exceeds available-to-sell but capped backorder fields exist', () => {
    const row = {
      quantity: 10,
      variantSku: 'V1',
      productsSearch: {
        inventoryTracking: 'product',
        totalOnHand: 3,
        availableToSell: 4,
        unlimitedBackorder: false,
      },
    } as QuoteLineNode;

    expect(draftQuoteListHasBackorderedItemsForDisplay([{ node: row }] as QuoteItem[])).toBe(true);
  });
});

describe('getQuoteBackorderDisplayFields for quote detail rows', () => {
  it('caps backorder display using enriched productsSearch ATS and API snapshot on-hand', () => {
    const row = {
      quantity: 100,
      variantSku: 'V1',
      totalOnHand: 3,
      quantityBackordered: 97,
      backorderMessage: 'Ships in 2 weeks',
      productsSearch: {
        inventoryTracking: 'product',
        totalOnHand: 99,
        availableToSell: 4,
        backorderMessage: 'Live message',
        unlimitedBackorder: false,
      },
    };

    expect(getQuoteBackorderDisplayFields(row)).toEqual({
      totalOnHand: 3,
      quantityBackordered: 1,
      backorderMessage: 'Ships in 2 weeks',
    });
  });

  it('prefers API snapshot totalOnHand and backorderMessage over productsSearch values', () => {
    const row = {
      quantity: 10,
      variantSku: 'V1',
      totalOnHand: 3,
      backorderMessage: 'Snapshot message',
      productsSearch: {
        inventoryTracking: 'product',
        totalOnHand: 99,
        availableToSell: 10,
        backorderMessage: 'Live message',
        unlimitedBackorder: false,
      },
    };

    expect(getQuoteBackorderDisplayFields(row)).toEqual({
      totalOnHand: 3,
      quantityBackordered: 7,
      backorderMessage: 'Snapshot message',
    });
  });

  it('returns null when ATS-capped quantity is covered by totalOnHand despite raw API backorder', () => {
    const row = {
      quantity: 100,
      variantSku: 'V1',
      totalOnHand: 5,
      quantityBackordered: 97,
      backorderMessage: 'Ships in 2 weeks',
      productsSearch: {
        inventoryTracking: 'product',
        totalOnHand: 99,
        availableToSell: 4,
        backorderMessage: 'Live message',
        unlimitedBackorder: false,
      },
    };

    expect(getQuoteBackorderDisplayFields(row)).toBeNull();
  });

  it('falls back to API backorder fields when inventory tracking is none', () => {
    const row = {
      quantity: 100,
      variantSku: 'V1',
      totalOnHand: 3,
      quantityBackordered: 97,
      backorderMessage: 'Ships in 2 weeks',
      productsSearch: {
        inventoryTracking: 'none',
      },
    };

    expect(getQuoteBackorderDisplayFields(row)).toEqual({
      totalOnHand: 3,
      quantityBackordered: 97,
      backorderMessage: 'Ships in 2 weeks',
    });
  });

  it('falls back to API quantityBackordered when totalOnHand is not provided', () => {
    const row = {
      quantity: 10,
      variantSku: 'V1',
      quantityBackordered: 3,
      productsSearch: {
        inventoryTracking: 'none',
      },
    };

    expect(getQuoteBackorderDisplayFields(row)).toEqual({
      totalOnHand: 0,
      quantityBackordered: 3,
      backorderMessage: undefined,
    });
  });

  it('falls back to API backorder fields when product totalOnHand is missing from lookup', () => {
    const row = {
      quantity: 10,
      variantSku: 'V1',
      quantityBackordered: 3,
      backorderMessage: 'Snapshot message',
      productsSearch: {
        inventoryTracking: 'product',
        availableToSell: 10,
        unlimitedBackorder: false,
      },
    };

    expect(getQuoteBackorderDisplayFields(row)).toEqual({
      totalOnHand: 0,
      quantityBackordered: 3,
      backorderMessage: 'Snapshot message',
    });
  });

  it('falls back to API backorder fields when variant total_on_hand is missing from lookup', () => {
    const row = {
      quantity: 10,
      variantSku: 'SKU-B',
      totalOnHand: 2,
      quantityBackordered: 8,
      backorderMessage: 'Snapshot message',
      productsSearch: {
        inventoryTracking: 'variant',
        availableToSell: 10,
        unlimitedBackorder: false,
        variants: [{ sku: 'SKU-B', backorder_message: 'Live message' }],
      },
    } as QuoteBackorderRow;

    expect(getQuoteBackorderDisplayFields(row)).toEqual({
      totalOnHand: 2,
      quantityBackordered: 8,
      backorderMessage: 'Snapshot message',
    });
  });
});

describe('getQuotePicklistSelections', () => {
  const picklistModifier = {
    id: 100,
    type: 'product_list',
    display_name: 'Pick a pickle',
    option_values: [{ id: 200, value_data: { product_id: 555 } }],
  };

  const buildRow = (optionList: string) =>
    ({
      quantity: 1,
      optionList,
      productsSearch: { modifiers: [picklistModifier] },
    }) as unknown as QuoteItem['node'];

  it('resolves a picklist selection from camelCase attribute-keyed optionList', () => {
    const optionList = JSON.stringify([{ optionId: 'attribute[100]', optionValue: '200' }]);

    expect(getQuotePicklistSelections(buildRow(optionList))).toEqual([
      { modifierId: 100, displayName: 'Pick a pickle', productId: 555 },
    ]);
  });

  it('resolves a picklist selection from snake_case option_id/option_value entries', () => {
    const optionList = JSON.stringify([{ option_id: 100, option_value: 200 }]);

    expect(getQuotePicklistSelections(buildRow(optionList))).toEqual([
      { modifierId: 100, displayName: 'Pick a pickle', productId: 555 },
    ]);
  });

  it('resolves a submitted quote selection from its options', () => {
    const row = {
      quantity: 1,
      options: [
        { optionId: 100, optionValue: 200, optionName: 'PickleFest', optionLabel: 'Ice Pick' },
      ],
      productsSearch: { modifiers: [picklistModifier] },
    } as unknown as QuoteItem['node'];

    expect(getQuotePicklistSelections(row)).toEqual([
      { modifierId: 100, displayName: 'Pick a pickle', productId: 555 },
    ]);
  });

  it('resolves a submitted quote selection even when a leftover draft optionList is present', () => {
    const row = {
      quantity: 1,
      options: [{ optionId: 100, optionValue: 200 }],
      optionList: '[]',
      productsSearch: { modifiers: [picklistModifier] },
    } as unknown as QuoteItem['node'];

    expect(getQuotePicklistSelections(row)).toEqual([
      { modifierId: 100, displayName: 'Pick a pickle', productId: 555 },
    ]);
  });

  it('returns an empty array when the modifier is not a picklist', () => {
    const optionList = JSON.stringify([{ optionId: 'attribute[100]', optionValue: '200' }]);
    const row = {
      quantity: 1,
      optionList,
      productsSearch: { modifiers: [{ ...picklistModifier, type: 'dropdown' }] },
    } as unknown as QuoteItem['node'];

    expect(getQuotePicklistSelections(row)).toEqual([]);
  });

  it('returns an empty array when optionList is empty', () => {
    expect(getQuotePicklistSelections(buildRow('[]'))).toEqual([]);
  });

  it('returns an empty array when optionList is not valid JSON', () => {
    expect(getQuotePicklistSelections(buildRow('not json'))).toEqual([]);
  });

  it('skips null and primitive entries without throwing on malformed optionList', () => {
    const optionList = JSON.stringify([
      null,
      'x',
      42,
      { optionId: 'attribute[100]', optionValue: '200' },
    ]);

    expect(getQuotePicklistSelections(buildRow(optionList))).toEqual([
      { modifierId: 100, displayName: 'Pick a pickle', productId: 555 },
    ]);
  });
});

describe('quoteDetailListHasBackorderedItemsForDisplay', () => {
  it('returns true when capped quote detail rows have backorder fields', () => {
    const row = {
      quantity: 100,
      variantSku: 'V1',
      totalOnHand: 3,
      quantityBackordered: 97,
      productsSearch: {
        inventoryTracking: 'product',
        availableToSell: 4,
        unlimitedBackorder: false,
      },
    };

    expect(quoteDetailListHasBackorderedItemsForDisplay([row])).toBe(true);
  });
});

describe('getRowPicklistBackorderSnapshot', () => {
  it('indexes the snapshot children by product id', () => {
    expect(
      getRowPicklistBackorderSnapshot({
        picklistBackorder: [
          { product_id: 555, quantity_backordered: 2, total_on_hand: 3 },
          { product_id: 666, quantity_backordered: 0, total_on_hand: 9 },
        ],
      }),
    ).toEqual({
      555: { product_id: 555, quantity_backordered: 2, total_on_hand: 3 },
      666: { product_id: 666, quantity_backordered: 0, total_on_hand: 9 },
    });
  });

  it('returns undefined when there is no snapshot (non-ordered quotes)', () => {
    expect(getRowPicklistBackorderSnapshot({})).toBeUndefined();
    expect(getRowPicklistBackorderSnapshot({ picklistBackorder: [] })).toBeUndefined();
  });
});

describe('quoteDetailListHasPicklistSnapshotBackordered', () => {
  const picklistModifier = {
    id: 100,
    type: 'product_list',
    display_name: 'Pick a pickle',
    option_values: [{ id: 200, value_data: { product_id: 555 } }],
  };

  const buildRow = (
    picklistBackorder: Array<{
      product_id: number;
      quantity_backordered: number;
      total_on_hand: number;
    }>,
  ) => ({
    optionList: JSON.stringify([{ option_id: 100, option_value: 200 }]),
    productsSearch: { modifiers: [picklistModifier] },
    picklistBackorder,
  });

  it('returns true when a resolved selection maps to a backordered snapshot child', () => {
    expect(
      quoteDetailListHasPicklistSnapshotBackordered([
        buildRow([{ product_id: 555, quantity_backordered: 1, total_on_hand: 0 }]),
      ]),
    ).toBe(true);
  });

  it('returns false when the matched snapshot child is not backordered', () => {
    expect(
      quoteDetailListHasPicklistSnapshotBackordered([
        buildRow([{ product_id: 555, quantity_backordered: 0, total_on_hand: 9 }]),
        {},
      ]),
    ).toBe(false);
  });

  it('returns false when a backordered snapshot child matches no picklist selection', () => {
    expect(
      quoteDetailListHasPicklistSnapshotBackordered([
        buildRow([{ product_id: 999, quantity_backordered: 3, total_on_hand: 0 }]),
      ]),
    ).toBe(false);
  });
});
