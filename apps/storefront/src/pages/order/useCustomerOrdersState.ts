import { useEffect, useState } from 'react';

import { OrdersFiltersInput } from '@/shared/service/bc/graphql/orders';
// Status list still comes from the legacy `orderStatuses` query — the unified
// schema doesn't expose one yet, so we depend on the legacy type here.
import { OrderStatusItem } from '@/types';

import {
  getCustomerOrdersInitFilter,
  normalizeString,
  packDateRange,
} from './unifiedApiFiltersHelper';
import {
  BASE_SORT_MAP,
  BaseSortableColumnKey,
  useUnifiedOrderSorting,
  UseUnifiedOrderSortingResult,
} from './useUnifiedOrderSorting';
import {
  useUnifiedOrdersPagination,
  UseUnifiedOrdersPaginationResult,
} from './useUnifiedOrdersPagination';

interface AppliedFilters {
  startValue?: string;
  endValue?: string;
  orderStatus?: string | number;
  company?: string;
}

interface UseCustomerOrdersStateArgs {
  companyId: number;
  orderStatuses: OrderStatusItem[];
}

export interface UseCustomerOrdersStateResult
  extends UseUnifiedOrdersPaginationResult,
    UseUnifiedOrderSortingResult<BaseSortableColumnKey> {
  filters: OrdersFiltersInput;
  handleSearchChange: (key: string, value: string) => void;
  handleFilterChange: (value: AppliedFilters) => void;
  handleCompanyIdsChange: (companyIds: number[]) => void;
}

export const useCustomerOrdersState = ({
  companyId,
  orderStatuses,
}: UseCustomerOrdersStateArgs): UseCustomerOrdersStateResult => {
  const [filters, setFilters] = useState<OrdersFiltersInput>(() =>
    getCustomerOrdersInitFilter(companyId),
  );

  const pagination = useUnifiedOrdersPagination();
  const sorting = useUnifiedOrderSorting(BASE_SORT_MAP, pagination.resetPagination, 'orderId');

  useEffect(() => {
    setFilters(getCustomerOrdersInitFilter(companyId));
  }, [companyId]);

  const handleSearchChange = (key: string, value: string) => {
    if (key !== 'search') return;
    pagination.resetPagination();
    setFilters((prev) => ({ ...prev, search: value || undefined }));
  };

  const handleFilterChange = (value: AppliedFilters) => {
    let currentStatus = normalizeString(value.orderStatus);
    if (currentStatus) {
      const originalStatus = orderStatuses.find(
        (status) => status.customLabel === currentStatus || status.systemLabel === currentStatus,
      );
      // Drop the filter on miss — never send a display label as the API status code.
      currentStatus = originalStatus?.systemLabel || undefined;
    }
    pagination.resetPagination();
    setFilters((prev) => ({
      ...prev,
      companyName: normalizeString(value.company),
      status: currentStatus,
      dateRange: packDateRange(value.startValue, value.endValue),
    }));
  };

  const handleCompanyIdsChange = (companyIds: number[]) => {
    const isAll = companyIds.length === 0 || companyIds.includes(-1);
    pagination.resetPagination();
    setFilters((prev) => ({
      ...prev,
      companyIds: isAll ? undefined : companyIds.map(String),
    }));
  };

  return {
    ...pagination,
    ...sorting,
    filters,
    handleSearchChange,
    handleFilterChange,
    handleCompanyIdsChange,
  };
};
