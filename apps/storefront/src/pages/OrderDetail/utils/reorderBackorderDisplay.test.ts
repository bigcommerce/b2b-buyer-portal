import { describe, expect, it } from 'vitest';

import type { CatalogQuickVariantSku } from '@/shared/service/b2b/graphql/product';

import {
  getReorderBackorderDisplayFields,
  getReorderBackorderDisplayQuantity,
  getReorderProductRowDisplayState,
  reorderQuantityExceedsAvailableToSell,
} from './reorderBackorderDisplay';

describe('reorderBackorderDisplay', () => {
  it('reorderQuantityExceedsAvailableToSell is false when unlimited backorder', () => {
    const row = {
      inventoryTracking: 'variant',
      unlimitedBackorder: true,
      availableToSell: 2,
    } as CatalogQuickVariantSku;

    expect(reorderQuantityExceedsAvailableToSell(100, row)).toBe(false);
  });

  it('reorderQuantityExceedsAvailableToSell is false when tracking is none', () => {
    const row = {
      inventoryTracking: 'none',
      availableToSell: 0,
    } as CatalogQuickVariantSku;

    expect(reorderQuantityExceedsAvailableToSell(100, row)).toBe(false);
  });

  it('reorderQuantityExceedsAvailableToSell when qty exceeds available to sell', () => {
    const row = {
      inventoryTracking: 'variant',
      unlimitedBackorder: false,
      availableToSell: 5,
    } as CatalogQuickVariantSku;

    expect(reorderQuantityExceedsAvailableToSell(6, row)).toBe(true);
    expect(reorderQuantityExceedsAvailableToSell(5, row)).toBe(false);
  });

  it('reorderQuantityExceedsAvailableToSell is false when row is undefined', () => {
    expect(reorderQuantityExceedsAvailableToSell(10, undefined)).toBe(false);
  });

  it('getReorderBackorderDisplayQuantity caps at available to sell when order qty exceeds it', () => {
    const row = {
      inventoryTracking: 'variant',
      unlimitedBackorder: false,
      availableToSell: 10,
      totalOnHand: 9,
    } as CatalogQuickVariantSku;

    expect(getReorderBackorderDisplayQuantity(100, row)).toBe(10);
  });

  it('getReorderBackorderDisplayQuantity returns order qty when within available to sell', () => {
    const row = {
      inventoryTracking: 'variant',
      unlimitedBackorder: false,
      availableToSell: 10,
    } as CatalogQuickVariantSku;

    expect(getReorderBackorderDisplayQuantity(7, row)).toBe(7);
  });

  it('getReorderBackorderDisplayQuantity returns order qty when row undefined', () => {
    expect(getReorderBackorderDisplayQuantity(100, undefined)).toBe(100);
  });

  it('backorder fields from capped qty when raw qty far exceeds available to sell', () => {
    const row = {
      inventoryTracking: 'variant',
      unlimitedBackorder: false,
      availableToSell: 10,
      totalOnHand: 9,
      backorderMessage: '2-4 weeks',
    } as CatalogQuickVariantSku;

    const capped = getReorderBackorderDisplayQuantity(100, row);
    expect(getReorderBackorderDisplayFields(capped, row)).toEqual({
      totalOnHand: 9,
      quantityBackordered: 1,
      backorderMessage: '2-4 weeks',
    });
  });

  it('getReorderBackorderDisplayFields computes quantity backordered vs total on hand', () => {
    const row = {
      inventoryTracking: 'variant',
      totalOnHand: 9,
      backorderMessage: 'Ships in 2 weeks',
    } as CatalogQuickVariantSku;

    const fields = getReorderBackorderDisplayFields(10, row);

    expect(fields).toEqual({
      totalOnHand: 9,
      quantityBackordered: 1,
      backorderMessage: 'Ships in 2 weeks',
    });
  });

  it('getReorderBackorderDisplayFields returns null when no backordered quantity', () => {
    const row = {
      inventoryTracking: 'variant',
      totalOnHand: 10,
    } as CatalogQuickVariantSku;

    expect(getReorderBackorderDisplayFields(10, row)).toBeNull();
  });

  it('getReorderBackorderDisplayFields returns null when inventory tracking is none', () => {
    const row = {
      inventoryTracking: 'none',
      totalOnHand: 0,
    } as CatalogQuickVariantSku;

    expect(getReorderBackorderDisplayFields(10, row)).toBeNull();
  });

  it('getReorderBackorderDisplayFields returns null when row is undefined', () => {
    expect(getReorderBackorderDisplayFields(10, undefined)).toBeNull();
  });

  it('getReorderBackorderDisplayFields returns null when totalOnHand is null', () => {
    const row = {
      inventoryTracking: 'variant',
      totalOnHand: null,
    } as CatalogQuickVariantSku;

    expect(getReorderBackorderDisplayFields(10, row)).toBeNull();
  });

  it('getReorderBackorderDisplayFields returns null when quantity is 0', () => {
    const row = {
      inventoryTracking: 'variant',
      totalOnHand: 5,
    } as CatalogQuickVariantSku;

    expect(getReorderBackorderDisplayFields(0, row)).toBeNull();
  });

  it('getReorderBackorderDisplayFields treats negative totalOnHand as fully backordered', () => {
    const row = {
      inventoryTracking: 'variant',
      totalOnHand: -3,
    } as CatalogQuickVariantSku;

    expect(getReorderBackorderDisplayFields(10, row)).toEqual({
      totalOnHand: -3,
      quantityBackordered: 13,
      backorderMessage: undefined,
    });
  });

  describe('getReorderProductRowDisplayState', () => {
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
        getReorderProductRowDisplayState({
          qty: 10,
          productHelperText: 'Server error',
          isReorder: true,
          inventoryRow,
          backorderUiEnabled: true,
          formatOnlyAvailable,
        }).qtyHelperText,
      ).toBe('Server error');
    });

    it('falls back to available-to-sell helper when validation helper is cleared', () => {
      expect(
        getReorderProductRowDisplayState({
          qty: 10,
          productHelperText: '',
          isReorder: true,
          inventoryRow,
          backorderUiEnabled: true,
          formatOnlyAvailable,
        }).qtyHelperText,
      ).toBe('Only 5 available');
    });

    it('returns null backorder fields when backorder UI is disabled', () => {
      expect(
        getReorderProductRowDisplayState({
          qty: 10,
          isReorder: true,
          inventoryRow,
          backorderUiEnabled: false,
          formatOnlyAvailable,
        }).backorderFields,
      ).toBeNull();
    });
  });
});
