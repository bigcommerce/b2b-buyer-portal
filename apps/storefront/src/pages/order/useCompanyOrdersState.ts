import { useEffect, useState } from 'react';

import { CompanyOrdersFiltersInput } from '@/shared/service/bc/graphql/orders';
import { OrderStatusItem } from '@/types';

import {
  getCompanyOrdersInitFilter,
  normalizeString,
  packDateRange,
} from './unifiedApiFiltersHelper';
import { CompanySortableColumnKey, useCompanyOrderSorting } from './useCompanyOrderSorting';
import { UseUnifiedOrderSortingResult } from './useUnifiedOrderSorting';
import {
  useUnifiedOrdersPagination,
  UseUnifiedOrdersPaginationResult,
} from './useUnifiedOrdersPagination';

interface AppliedFilters {
  startValue?: string;
  endValue?: string;
  orderStatus?: string | number;
  PlacedBy?: string;
  company?: string;
}

interface UseCompanyOrdersStateArgs {
  selectedCompanyId: number;
  orderStatuses: OrderStatusItem[];
}

export interface UseCompanyOrdersStateResult
  extends UseUnifiedOrdersPaginationResult,
    UseUnifiedOrderSortingResult<CompanySortableColumnKey> {
  filters: CompanyOrdersFiltersInput;
  handleSearchChange: (key: string, value: string) => void;
  handleFilterChange: (value: AppliedFilters) => void;
  handleCompanyIdsChange: (companyIds: number[]) => void;
}

export const useCompanyOrdersState = ({
  selectedCompanyId,
  orderStatuses,
}: UseCompanyOrdersStateArgs): UseCompanyOrdersStateResult => {
  const [filters, setFilters] = useState<CompanyOrdersFiltersInput>(() =>
    getCompanyOrdersInitFilter(selectedCompanyId),
  );

  const pagination = useUnifiedOrdersPagination();
  const sorting = useCompanyOrderSorting(pagination.resetPagination);

  useEffect(() => {
    setFilters(getCompanyOrdersInitFilter(selectedCompanyId));
  }, [selectedCompanyId]);

  const handleSearchChange = (key: string, value: string) => {
    if (key !== 'search') return;
    pagination.resetPagination();
    setFilters((prev) => ({ ...prev, search: value || undefined }));
  };

  const handleFilterChange = (value: AppliedFilters) => {
    let resolvedStatuses: string[] | undefined;
    const rawStatus = normalizeString(value.orderStatus);
    if (rawStatus) {
      const originalStatus = orderStatuses.find(
        (s) => s.customLabel === rawStatus || s.systemLabel === rawStatus,
      );
      resolvedStatuses = originalStatus?.systemLabel ? [originalStatus.systemLabel] : undefined;
    }

    pagination.resetPagination();
    setFilters((prev) => ({
      ...prev,
      status: resolvedStatuses,
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
