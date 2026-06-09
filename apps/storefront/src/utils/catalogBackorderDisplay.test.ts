import { describe, expect, it } from 'vitest';

import type { CatalogQuickVariantSku, ProductSearch } from '@/shared/service/b2b/graphql/product';
import type { Variant } from '@/types/products';
import type { ShoppingListProductItem } from '@/types/shoppingList';

import {
  buildVariantSkuDependencyKey,
  catalogListHasBackorderedItemsForDisplay,
  catalogListHasPicklistBackorderedItemsForDisplay,
  getCatalogBackorderDisplayFields,
  getCatalogBackorderDisplayQuantity,
  getCatalogBackorderFieldsForVariantSku,
  getCatalogInventoryRowFromSearchProduct,
  getCatalogProductRowDisplayState,
  getPicklistSelectionsForRow,
  quantityExceedsAvailableToSell,
} from './catalogBackorderDisplay';

describe('catalogBackorderDisplay', () => {
  it('buildVariantSkuDependencyKey deduplicates, filters empty values, and sorts skus', () => {
    expect(buildVariantSkuDependencyKey(['B-SKU', 'A-SKU', 'B-SKU', '', null, undefined])).toBe(
      'A-SKU|B-SKU',
    );
  });

  it('quantityExceedsAvailableToSell is false when unlimited backorder', () => {
    const row = {
      inventoryTracking: 'variant',
      unlimitedBackorder: true,
      availableToSell: 2,
    } as CatalogQuickVariantSku;

    expect(quantityExceedsAvailableToSell(100, row)).toBe(false);
  });

  it('quantityExceedsAvailableToSell is false when tracking is none', () => {
    const row = {
      inventoryTracking: 'none',
      availableToSell: 0,
    } as CatalogQuickVariantSku;

    expect(quantityExceedsAvailableToSell(100, row)).toBe(false);
  });

  it('quantityExceedsAvailableToSell when qty exceeds available to sell', () => {
    const row = {
      inventoryTracking: 'variant',
      unlimitedBackorder: false,
      availableToSell: 5,
    } as CatalogQuickVariantSku;

    expect(quantityExceedsAvailableToSell(6, row)).toBe(true);
    expect(quantityExceedsAvailableToSell(5, row)).toBe(false);
  });

  it('quantityExceedsAvailableToSell is false when row is undefined', () => {
    expect(quantityExceedsAvailableToSell(10, undefined)).toBe(false);
  });

  it('getCatalogBackorderDisplayQuantity caps at available to sell when qty exceeds it', () => {
    const row = {
      inventoryTracking: 'variant',
      unlimitedBackorder: false,
      availableToSell: 10,
      totalOnHand: 9,
    } as CatalogQuickVariantSku;

    expect(getCatalogBackorderDisplayQuantity(100, row)).toBe(10);
  });

  it('getCatalogBackorderDisplayQuantity returns qty when within available to sell', () => {
    const row = {
      inventoryTracking: 'variant',
      unlimitedBackorder: false,
      availableToSell: 10,
    } as CatalogQuickVariantSku;

    expect(getCatalogBackorderDisplayQuantity(7, row)).toBe(7);
  });

  it('getCatalogBackorderDisplayQuantity returns qty when row undefined', () => {
    expect(getCatalogBackorderDisplayQuantity(100, undefined)).toBe(100);
  });

  it('backorder fields from capped qty when raw qty far exceeds available to sell', () => {
    const row = {
      inventoryTracking: 'variant',
      unlimitedBackorder: false,
      availableToSell: 10,
      totalOnHand: 9,
      backorderMessage: '2-4 weeks',
    } as CatalogQuickVariantSku;

    const capped = getCatalogBackorderDisplayQuantity(100, row);
    expect(getCatalogBackorderDisplayFields(capped, row)).toEqual({
      totalOnHand: 9,
      quantityBackordered: 1,
      backorderMessage: '2-4 weeks',
    });
  });

  it('getCatalogBackorderDisplayFields computes quantity backordered vs total on hand', () => {
    const row = {
      inventoryTracking: 'variant',
      totalOnHand: 9,
      backorderMessage: 'Ships in 2 weeks',
    } as CatalogQuickVariantSku;

    const fields = getCatalogBackorderDisplayFields(10, row);

    expect(fields).toEqual({
      totalOnHand: 9,
      quantityBackordered: 1,
      backorderMessage: 'Ships in 2 weeks',
    });
  });

  it('getCatalogBackorderDisplayFields returns null when no backordered quantity', () => {
    const row = {
      inventoryTracking: 'variant',
      totalOnHand: 10,
    } as CatalogQuickVariantSku;

    expect(getCatalogBackorderDisplayFields(10, row)).toBeNull();
  });

  it('getCatalogBackorderDisplayFields returns null when inventory tracking is none', () => {
    const row = {
      inventoryTracking: 'none',
      totalOnHand: 0,
    } as CatalogQuickVariantSku;

    expect(getCatalogBackorderDisplayFields(10, row)).toBeNull();
  });

  it('getCatalogBackorderDisplayFields returns null when row is undefined', () => {
    expect(getCatalogBackorderDisplayFields(10, undefined)).toBeNull();
  });

  it('getCatalogBackorderDisplayFields returns null when totalOnHand is null', () => {
    const row = {
      inventoryTracking: 'variant',
      totalOnHand: null,
    } as CatalogQuickVariantSku;

    expect(getCatalogBackorderDisplayFields(10, row)).toBeNull();
  });

  it('getCatalogBackorderDisplayFields returns null when quantity is 0', () => {
    const row = {
      inventoryTracking: 'variant',
      totalOnHand: 5,
    } as CatalogQuickVariantSku;

    expect(getCatalogBackorderDisplayFields(0, row)).toBeNull();
  });

  it('getCatalogBackorderDisplayFields treats negative totalOnHand as fully backordered', () => {
    const row = {
      inventoryTracking: 'variant',
      totalOnHand: -3,
    } as CatalogQuickVariantSku;

    expect(getCatalogBackorderDisplayFields(10, row)).toEqual({
      totalOnHand: -3,
      quantityBackordered: 13,
      backorderMessage: undefined,
    });
  });

  describe('getCatalogInventoryRowFromSearchProduct', () => {
    const productBase = {
      inventoryTracking: 'variant',
      availableToSell: 0,
      unlimitedBackorder: false,
      totalOnHand: null,
      backorderMessage: null,
    } as Pick<
      ShoppingListProductItem,
      | 'inventoryTracking'
      | 'availableToSell'
      | 'unlimitedBackorder'
      | 'totalOnHand'
      | 'backorderMessage'
    >;

    const variant = {
      available_to_sell: 10,
      unlimited_backorder: false,
      total_on_hand: 3,
      backorder_message: 'Lead time: 2 weeks',
    } as Variant;

    it('returns undefined when inventory tracking is none', () => {
      expect(
        getCatalogInventoryRowFromSearchProduct(
          { ...productBase, inventoryTracking: 'none' },
          variant,
        ),
      ).toBeUndefined();
    });

    it('maps product-level fields when tracking is product', () => {
      expect(
        getCatalogInventoryRowFromSearchProduct(
          {
            ...productBase,
            inventoryTracking: 'product',
            availableToSell: 8,
            unlimitedBackorder: true,
            totalOnHand: 5,
            backorderMessage: 'Ships soon',
          },
          variant,
        ),
      ).toEqual({
        inventoryTracking: 'product',
        availableToSell: 8,
        unlimitedBackorder: true,
        totalOnHand: 5,
        backorderMessage: 'Ships soon',
      });
    });

    it('maps variant-level fields when tracking is variant', () => {
      expect(
        getCatalogInventoryRowFromSearchProduct(
          { ...productBase, inventoryTracking: 'variant' },
          variant,
        ),
      ).toEqual({
        inventoryTracking: 'variant',
        availableToSell: 10,
        unlimitedBackorder: false,
        totalOnHand: 3,
        backorderMessage: 'Lead time: 2 weeks',
      });
    });

    it('returns undefined for variant tracking when variant is not resolved', () => {
      expect(
        getCatalogInventoryRowFromSearchProduct(
          { ...productBase, inventoryTracking: 'variant' },
          null,
        ),
      ).toBeUndefined();
    });
  });

  describe('getCatalogBackorderFieldsForVariantSku', () => {
    const inventoryRow = {
      inventoryTracking: 'variant',
      variantSku: 'SKU-1',
      availableToSell: 5,
      totalOnHand: 3,
      backorderMessage: '2 weeks',
    } as CatalogQuickVariantSku;

    it('returns null when variantSku is missing', () => {
      expect(
        getCatalogBackorderFieldsForVariantSku({
          quantity: 10,
          inventoryBySku: { 'SKU-1': inventoryRow },
        }),
      ).toBeNull();
    });

    it('returns null when sku is not in inventoryBySku', () => {
      expect(
        getCatalogBackorderFieldsForVariantSku({
          quantity: 10,
          variantSku: 'UNKNOWN',
          inventoryBySku: { 'SKU-1': inventoryRow },
        }),
      ).toBeNull();
    });

    it('resolves catalog row by sku and computes backorder fields', () => {
      expect(
        getCatalogBackorderFieldsForVariantSku({
          quantity: 10,
          variantSku: 'sku-1',
          inventoryBySku: { 'SKU-1': inventoryRow },
        }),
      ).toEqual({
        totalOnHand: 3,
        quantityBackordered: 2,
        backorderMessage: '2 weeks',
      });
    });
  });

  describe('getCatalogProductRowDisplayState', () => {
    const inventoryRow = {
      inventoryTracking: 'variant',
      unlimitedBackorder: false,
      availableToSell: 5,
      totalOnHand: 3,
      backorderMessage: '2 weeks',
    } as CatalogQuickVariantSku;

    const formatOnlyAvailable = (count: number) => `Only ${count} available`;

    it('uses validation helper text when present', () => {
      expect(
        getCatalogProductRowDisplayState({
          qty: 10,
          productHelperText: 'Server error',
          showAvailableToSellHelper: true,
          inventoryRow,
          backorderUiEnabled: true,
          formatOnlyAvailable,
        }).qtyHelperText,
      ).toBe('Server error');
    });

    it('falls back to available-to-sell helper when validation helper is cleared', () => {
      expect(
        getCatalogProductRowDisplayState({
          qty: 10,
          productHelperText: '',
          showAvailableToSellHelper: true,
          inventoryRow,
          backorderUiEnabled: true,
          formatOnlyAvailable,
        }).qtyHelperText,
      ).toBe('Only 5 available');
    });

    it('returns null backorder fields when backorder UI is disabled', () => {
      expect(
        getCatalogProductRowDisplayState({
          qty: 10,
          showAvailableToSellHelper: true,
          inventoryRow,
          backorderUiEnabled: false,
          formatOnlyAvailable,
        }).backorderFields,
      ).toBeNull();
    });
  });

  describe('catalogListHasBackorderedItemsForDisplay', () => {
    const inventoryRow = {
      inventoryTracking: 'variant',
      variantSku: 'SKU-1',
      availableToSell: 10,
      totalOnHand: 3,
      backorderMessage: '2 weeks',
    } as CatalogQuickVariantSku;

    const inventoryBySku = { 'SKU-1': inventoryRow };

    it('returns false for an empty list', () => {
      expect(catalogListHasBackorderedItemsForDisplay([], inventoryBySku)).toBe(false);
    });

    it('returns true when any item has backordered quantity', () => {
      expect(
        catalogListHasBackorderedItemsForDisplay(
          [{ qty: 10, variantSku: 'SKU-1' }],
          inventoryBySku,
        ),
      ).toBe(true);
    });

    it('returns false when qty is within on hand', () => {
      expect(
        catalogListHasBackorderedItemsForDisplay([{ qty: 3, variantSku: 'SKU-1' }], inventoryBySku),
      ).toBe(false);
    });

    it('returns false when sku is missing from inventory map', () => {
      expect(
        catalogListHasBackorderedItemsForDisplay(
          [{ qty: 10, variantSku: 'UNKNOWN' }],
          inventoryBySku,
        ),
      ).toBe(false);
    });
  });

  describe('getPicklistSelectionsForRow', () => {
    const buildRow = (type: string) => ({
      optionSelections: [{ option_id: 100, value_id: 200 }],
      productsSearch: {
        modifiers: [
          {
            id: 100,
            type,
            display_name: 'Bundle option 1',
            option_values: [{ id: 200, value_data: { product_id: 555 } }],
          },
        ],
      },
    });

    it('resolves a product_list selection to its product id', () => {
      expect(getPicklistSelectionsForRow(buildRow('product_list'))).toEqual([
        { modifierId: 100, displayName: 'Bundle option 1', productId: 555 },
      ]);
    });

    it('resolves a product_list_with_images selection to its product id', () => {
      expect(getPicklistSelectionsForRow(buildRow('product_list_with_images'))).toEqual([
        { modifierId: 100, displayName: 'Bundle option 1', productId: 555 },
      ]);
    });

    it('returns an empty array when there are no picklist modifiers', () => {
      expect(getPicklistSelectionsForRow(buildRow('dropdown'))).toEqual([]);
    });

    it('returns an empty array when optionSelections is missing', () => {
      expect(
        getPicklistSelectionsForRow({
          productsSearch: buildRow('product_list').productsSearch,
        }),
      ).toEqual([]);
    });

    it('skips a selected option value that has no product id', () => {
      expect(
        getPicklistSelectionsForRow({
          optionSelections: [{ option_id: 100, value_id: 200 }],
          productsSearch: {
            modifiers: [
              {
                id: 100,
                type: 'product_list',
                display_name: 'Bundle option 1',
                option_values: [{ id: 200, value_data: {} }],
              },
            ],
          },
        }),
      ).toEqual([]);
    });

    it('resolves multiple picklist modifiers into multiple selections', () => {
      expect(
        getPicklistSelectionsForRow({
          optionSelections: [
            { option_id: 100, value_id: 200 },
            { option_id: 101, value_id: 201 },
          ],
          productsSearch: {
            modifiers: [
              {
                id: 100,
                type: 'product_list',
                display_name: 'Bundle option 1',
                option_values: [{ id: 200, value_data: { product_id: 555 } }],
              },
              {
                id: 101,
                type: 'product_list_with_images',
                display_name: 'Bundle option 2',
                option_values: [{ id: 201, value_data: { product_id: 666 } }],
              },
            ],
          },
        }),
      ).toEqual([
        { modifierId: 100, displayName: 'Bundle option 1', productId: 555 },
        { modifierId: 101, displayName: 'Bundle option 2', productId: 666 },
      ]);
    });
  });

  describe('catalogListHasPicklistBackorderedItemsForDisplay', () => {
    const productTrackedPicklist = {
      id: 555,
      inventoryTracking: 'product',
      availableToSell: 10,
      unlimitedBackorder: false,
      totalOnHand: 9,
      backorderMessage: 'Lead time: 2-4 weeks',
    } as ProductSearch;

    const variantTrackedPicklist = {
      id: 666,
      inventoryTracking: 'variant',
      variants: [
        {
          available_to_sell: 10,
          unlimited_backorder: false,
          total_on_hand: 9,
          backorder_message: 'Lead time: 2-4 weeks',
        },
      ],
    } as unknown as ProductSearch;

    const selection = { modifierId: 100, displayName: 'Bundle option 1', productId: 555 };

    it('returns true when a product-tracked picklist item is backordered', () => {
      expect(
        catalogListHasPicklistBackorderedItemsForDisplay([{ qty: 10, selections: [selection] }], {
          555: productTrackedPicklist,
        }),
      ).toBe(true);
    });

    it('returns true when a variant-tracked picklist item is backordered', () => {
      expect(
        catalogListHasPicklistBackorderedItemsForDisplay(
          [{ qty: 10, selections: [{ ...selection, productId: 666 }] }],
          { 666: variantTrackedPicklist },
        ),
      ).toBe(true);
    });

    it('returns false when qty is within on hand', () => {
      expect(
        catalogListHasPicklistBackorderedItemsForDisplay([{ qty: 9, selections: [selection] }], {
          555: productTrackedPicklist,
        }),
      ).toBe(false);
    });

    it('returns false when the picklist product is missing from the map', () => {
      expect(
        catalogListHasPicklistBackorderedItemsForDisplay(
          [{ qty: 10, selections: [selection] }],
          {},
        ),
      ).toBe(false);
    });
  });
});
