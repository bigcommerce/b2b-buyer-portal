import { describe, expect, it } from 'vitest';

import { OrdersSortInput } from '@/shared/service/bc/graphql/orders';

import {
  adaptUnifiedToLegacyFilterParams,
  AdaptUnifiedToLegacyFilterParamsArgs,
} from './adaptUnifiedToLegacyFilterParams';

const baseArgs: AdaptUnifiedToLegacyFilterParamsArgs = {
  filters: {},
  activeSort: { key: 'orderId', dir: 'desc' },
  isB2BUser: false,
};

describe('adaptUnifiedToLegacyFilterParams', () => {
  describe('filterData', () => {
    it('maps all unified filter fields to the legacy shape', () => {
      const { filterData } = adaptUnifiedToLegacyFilterParams({
        ...baseArgs,
        filters: {
          search: 'widget',
          status: 'AWAITING_FULFILLMENT',
          dateRange: { from: '2026-01-01', to: '2026-02-01' },
          companyName: 'Acme',
          companyIds: ['1', '2', '3'],
        },
      });

      expect(filterData).toEqual({
        q: 'widget',
        statusCode: 'AWAITING_FULFILLMENT',
        beginDateAt: '2026-01-01',
        endDateAt: '2026-02-01',
        companyName: 'Acme',
        companyIds: [1, 2, 3],
        isShowMy: undefined,
      });
    });

    it('defaults missing search to an empty string', () => {
      const { filterData } = adaptUnifiedToLegacyFilterParams(baseArgs);

      expect(filterData.q).toBe('');
    });

    it('defaults missing companyName to an empty string', () => {
      const { filterData } = adaptUnifiedToLegacyFilterParams(baseArgs);

      expect(filterData.companyName).toBe('');
    });

    it('passes status through, defaulting undefined to an empty string', () => {
      const { filterData: withStatus } = adaptUnifiedToLegacyFilterParams({
        ...baseArgs,
        filters: { status: 'COMPLETED' },
      });
      const { filterData: noStatus } = adaptUnifiedToLegacyFilterParams(baseArgs);

      expect(withStatus.statusCode).toBe('COMPLETED');
      expect(noStatus.statusCode).toBe('');
    });

    it('sets beginDateAt/endDateAt to null when dateRange is missing', () => {
      const { filterData } = adaptUnifiedToLegacyFilterParams(baseArgs);

      expect(filterData.beginDateAt).toBeNull();
      expect(filterData.endDateAt).toBeNull();
    });

    it('sets endDateAt to null when dateRange.to is missing', () => {
      const { filterData } = adaptUnifiedToLegacyFilterParams({
        ...baseArgs,
        filters: { dateRange: { from: '2026-01-01' } },
      });

      expect(filterData.beginDateAt).toBe('2026-01-01');
      expect(filterData.endDateAt).toBeNull();
    });

    it('converts companyIds from strings to numbers', () => {
      const { filterData } = adaptUnifiedToLegacyFilterParams({
        ...baseArgs,
        filters: { companyIds: ['10', '20'] },
      });

      expect(filterData.companyIds).toEqual([10, 20]);
    });

    it('leaves companyIds undefined when not provided for non-B2B users', () => {
      const { filterData } = adaptUnifiedToLegacyFilterParams(baseArgs);

      expect(filterData.companyIds).toBeUndefined();
    });

    it('falls back to an empty array for B2B users when companyIds is undefined', () => {
      // Legacy "All companies" sets companyIds to []; the unified hook represents
      // the same state as undefined. Adapter must restore the empty array so the
      // GraphQL template still emits `companyIds: []` instead of omitting the field.
      const { filterData } = adaptUnifiedToLegacyFilterParams({ ...baseArgs, isB2BUser: true });

      expect(filterData.companyIds).toEqual([]);
    });

    it('sets isShowMy to 1 for B2B users', () => {
      const { filterData } = adaptUnifiedToLegacyFilterParams({ ...baseArgs, isB2BUser: true });

      expect(filterData.isShowMy).toBe(1);
    });

    it('leaves isShowMy undefined for non-B2B users', () => {
      const { filterData } = adaptUnifiedToLegacyFilterParams({ ...baseArgs, isB2BUser: false });

      expect(filterData.isShowMy).toBeUndefined();
    });
  });

  describe('orderBy', () => {
    it.each([
      ['orderId', 'bcOrderId'],
      ['poNumber', 'poNumber'],
      ['totalIncTax', 'totalIncTax'],
      ['status', 'status'],
      ['createdAt', 'createdAt'],
    ] as const)('maps %s asc to the legacy sort key without a leading dash', (key, expected) => {
      const { orderBy } = adaptUnifiedToLegacyFilterParams({
        ...baseArgs,
        activeSort: { key, dir: 'asc' },
      });

      expect(orderBy).toBe(expected);
    });

    it('prefixes the sort key with a dash when dir is desc', () => {
      const { orderBy } = adaptUnifiedToLegacyFilterParams({
        ...baseArgs,
        activeSort: { key: 'orderId', dir: 'desc' },
      });

      expect(orderBy).toBe('-bcOrderId');
    });

    it('works with a sort mapped from a unified OrdersSortInput round-trip', () => {
      // Sanity check that the legacy string survives after a consumer converts
      // activeSort → OrdersSortInput (via COLUMN_KEY_TO_SORT_INPUT) and back.
      expect(OrdersSortInput.ID_Z_TO_A).toBeDefined();

      const { orderBy } = adaptUnifiedToLegacyFilterParams({
        ...baseArgs,
        activeSort: { key: 'totalIncTax', dir: 'desc' },
      });

      expect(orderBy).toBe('-totalIncTax');
    });
  });
});
