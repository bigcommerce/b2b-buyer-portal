import { describe, expect, it } from 'vitest';

import { OrdersFiltersInput } from '@/shared/service/bc/graphql/orders';

import { toISODateRangeFilters } from './unifiedApiFiltersHelper';

const NEW_YORK_STANDARD_OFFSET = -5 * 60 * 60;
const SYDNEY_DAYLIGHT_OFFSET = 11 * 60 * 60;

const pickedRange = { from: '2026-10-01', to: '2026-10-05' };

describe('toISODateRangeFilters', () => {
  it('returns the filters unchanged when there is no date range', () => {
    const filters: OrdersFiltersInput = { status: 'SHIPPED' };

    expect(toISODateRangeFilters(filters, NEW_YORK_STANDARD_OFFSET)).toBe(filters);
  });

  it('keeps the other filters', () => {
    expect(toISODateRangeFilters({ status: 'SHIPPED', dateRange: pickedRange }, 0)).toMatchObject({
      status: 'SHIPPED',
    });
  });

  it('spans whole UTC days when the store offset is zero', () => {
    expect(toISODateRangeFilters({ dateRange: pickedRange }, 0).dateRange).toEqual({
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-05T23:59:59.999Z',
    });
  });

  it('spans whole store-time days for a store behind UTC', () => {
    expect(
      toISODateRangeFilters({ dateRange: pickedRange }, NEW_YORK_STANDARD_OFFSET).dateRange,
    ).toEqual({
      from: '2026-10-01T05:00:00.000Z',
      to: '2026-10-06T04:59:59.999Z',
    });
  });

  it('spans whole store-time days for a store ahead of UTC', () => {
    expect(
      toISODateRangeFilters({ dateRange: pickedRange }, SYDNEY_DAYLIGHT_OFFSET).dateRange,
    ).toEqual({
      from: '2026-09-30T13:00:00.000Z',
      to: '2026-10-05T12:59:59.999Z',
    });
  });

  it('includes an order shown on the end date in store time but placed the next UTC day', () => {
    const placedAt = Date.parse('2026-10-06T01:11:56Z');
    const { dateRange } = toISODateRangeFilters(
      { dateRange: pickedRange },
      NEW_YORK_STANDARD_OFFSET,
    );

    expect(placedAt).toBeLessThanOrEqual(Date.parse(dateRange!.to!));
  });

  it('excludes an order placed just after the store-time end of day', () => {
    const placedAt = Date.parse('2026-10-06T05:00:00Z');
    const { dateRange } = toISODateRangeFilters(
      { dateRange: pickedRange },
      NEW_YORK_STANDARD_OFFSET,
    );

    expect(placedAt).toBeGreaterThan(Date.parse(dateRange!.to!));
  });

  it('leaves the range open-ended when no end date is picked', () => {
    expect(
      toISODateRangeFilters({ dateRange: { from: '2026-10-01' } }, NEW_YORK_STANDARD_OFFSET)
        .dateRange,
    ).toEqual({ from: '2026-10-01T05:00:00.000Z' });
  });
});
