import { describe, expect, it } from 'vitest';

import type { CatalogQuickVariantSku } from '@/shared/service/b2b/graphql/product';

import { getReorderBackorderDisplayFields } from './reorderBackorderDisplay';

describe('reorderBackorderDisplay', () => {
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
});
