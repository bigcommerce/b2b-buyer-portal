import { useState } from 'react';

import { OrdersFiltersInput } from '@/shared/service/bc/graphql/orders';
// Status list still comes from the legacy `orderStatuses` query — the unified
// schema doesn't expose one yet, so we depend on the legacy type here.
import { OrderStatusItem } from '@/types';

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
}

export interface UseCustomerOrdersStateResult
  extends UseUnifiedOrdersPaginationResult,
    UseUnifiedOrderSortingResult<BaseSortableColumnKey> {
  filters: OrdersFiltersInput;
  handleFilterChange: (value: AppliedFilters) => void;
}

export const useCustomerOrdersState = ({
  orderStatuses,
}: UseCustomerOrdersStateArgs): UseCustomerOrdersStateResult => {
  const [filters, setFilters] = useState<OrdersFiltersInput>(() => getCustomerOrdersInitFilter());

  const pagination = useUnifiedOrdersPagination();
  const sorting = useUnifiedOrderSorting(BASE_SORT_MAP, pagination.resetPagination, 'orderId');

  const handleFilterChange = (value: AppliedFilters) => {
    const selected = normalizeString(value.orderStatus);
    // Resolve the display label to its systemLabel, then to the OrderStatusValue enum
    // member the schema requires. Drop the filter on either miss — sending a display
    // string into an enum argument is rejected at variable coercion.
    const matched = selected
      ? orderStatuses.find(
          (status) => status.customLabel === selected || status.systemLabel === selected,
        )
      : undefined;
    const status = matched ? systemLabelToOrderStatusValue(matched.systemLabel) : undefined;

    pagination.resetPagination();
    setFilters((prev) => ({
      ...prev,
      status,
      dateRange: packDateRange(value.startValue, value.endValue),
    }));
  };

  return {
    ...pagination,
    ...sorting,
    filters,
    handleFilterChange,
  };
};
