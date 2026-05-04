/**
 * TEMPORARY, needs to be removed
 *
 * Bridges the unified filter state (OrdersFiltersInput + activeSort) back to the
 * legacy FilterSearchProps + orderBy shape consumed by getB2BAllOrders /
 * getBCAllOrders, so the new filter hook can drive the existing data-fetch path
 * before the data source itself is switched to getCustomerOrders.
 *
 * Once Order.tsx calls getCustomerOrders directly, delete this file.
 */

import { FilterSearchProps, sortKeys } from './config';
import type { UseCustomerOrdersStateResult } from './useCustomerOrdersState';

export type AdaptUnifiedToLegacyFilterParamsArgs = Pick<
  UseCustomerOrdersStateResult,
  'filters' | 'activeSort'
> & {
  isB2BUser: boolean;
};

export const adaptUnifiedToLegacyFilterParams = ({
  filters,
  activeSort,
  isB2BUser,
}: AdaptUnifiedToLegacyFilterParamsArgs): {
  filterData: Partial<FilterSearchProps>;
  orderBy: string;
} => ({
  filterData: {
    q: filters.search ?? '',
    statusCode: filters.status ?? '',
    beginDateAt: filters.dateRange?.from ?? null,
    endDateAt: filters.dateRange?.to ?? null,
    companyName: filters.companyName ?? '',
    // Legacy emits `companyIds: []` for "All"; restore that for B2B users.
    companyIds: filters.companyIds?.map(Number) ?? (isB2BUser ? [] : undefined),
    isShowMy: isB2BUser ? 1 : undefined,
  },
  orderBy: activeSort.dir === 'desc' ? `-${sortKeys[activeSort.key]}` : sortKeys[activeSort.key],
});
