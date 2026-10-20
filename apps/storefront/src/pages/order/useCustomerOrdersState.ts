import { useEffect, useState } from 'react';

import { OrdersFiltersInput } from '@/shared/service/bc/graphql/orders';
// Status list still comes from the legacy `orderStatuses` query — the unified
// schema doesn't expose one yet, so we depend on the legacy type here.
import { OrderStatusItem } from '@/types';

import { findOrderStatus } from './shared/findOrderStatus';
import { systemLabelToOrderStatusValue } from './shared/orderStatusValue';
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
}

interface UseCustomerOrdersStateArgs {
  orderStatuses: OrderStatusItem[];
  selectedCompanyId?: number;
}

export interface UseCustomerOrdersStateResult
  extends UseUnifiedOrdersPaginationResult,
    UseUnifiedOrderSortingResult<BaseSortableColumnKey> {
  filters: OrdersFiltersInput;
  selectedCompanyIds: number[] | null;
  handleFilterChange: (value: AppliedFilters) => void;
  handleSearchChange: (key: string, value: string) => void;
  handleCompanyIdsChange: (companyIds: number[]) => void;
}

export const useCustomerOrdersState = ({
  orderStatuses,
  selectedCompanyId,
}: UseCustomerOrdersStateArgs): UseCustomerOrdersStateResult => {
  const [filters, setFilters] = useState<OrdersFiltersInput>(() => getCustomerOrdersInitFilter());

  const pagination = useUnifiedOrdersPagination();
  const sorting = useUnifiedOrderSorting(BASE_SORT_MAP, pagination.resetPagination, 'orderId');

  const handleSearchChange = (key: string, value: string) => {
    if (key !== 'search') return;
    pagination.resetPagination();
    setFilters((prev) => ({ ...prev, search: value || undefined }));
  };

  const handleFilterChange = (value: AppliedFilters) => {
    const selected = normalizeString(value.orderStatus);
    // Resolve the display label to its systemLabel, then to the OrderStatusValue enum
    // member the schema requires. Drop the filter on either miss — sending a display
    // string into an enum argument is rejected at variable coercion.
    const matched = selected ? findOrderStatus(orderStatuses, selected) : undefined;
    const status = matched ? systemLabelToOrderStatusValue(matched.systemLabel) : undefined;

    pagination.resetPagination();
    setFilters((prev) => ({
      ...prev,
      status,
      dateRange: packDateRange(value.startValue, value.endValue),
    }));
  };

  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[] | null>(null);

  useEffect(() => {
    setSelectedCompanyIds(null);
  }, [selectedCompanyId]);

  const handleCompanyIdsChange = (companyIds: number[]) => {
    const isAll = companyIds.length === 0 || companyIds.includes(-1);
    setSelectedCompanyIds(isAll ? [] : companyIds);
    pagination.resetPagination();
  };

  return {
    ...pagination,
    ...sorting,
    filters,
    selectedCompanyIds,
    handleFilterChange,
    handleSearchChange,
    handleCompanyIdsChange,
  };
};
