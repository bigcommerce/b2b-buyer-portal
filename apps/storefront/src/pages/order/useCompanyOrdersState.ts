import { useEffect, useState } from 'react';

import { CompanyOrdersFiltersInput } from '@/shared/service/bc/graphql/orders';
import { OrderStatusItem } from '@/types';

import { formatPlacedByLabel } from './config';
import {
  getCompanyOrdersInitFilter,
  normalizeString,
  packDateRange,
} from './unifiedApiFiltersHelper';
import { CompanySortableColumnKey, useCompanyOrderSorting } from './useCompanyOrderSorting';
import { usePlacedByUsers } from './usePlacedByUsers';
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
  isEnabled: boolean;
}

export interface UseCompanyOrdersStateResult
  extends UseUnifiedOrdersPaginationResult,
    UseUnifiedOrderSortingResult<CompanySortableColumnKey> {
  filters: CompanyOrdersFiltersInput;
  placedByUsers: ReturnType<typeof usePlacedByUsers>;
  handleSearchChange: (key: string, value: string) => void;
  handleFilterChange: (value: AppliedFilters) => void;
  handleCompanyIdsChange: (companyIds: number[]) => void;
}

export const useCompanyOrdersState = ({
  selectedCompanyId,
  orderStatuses,
  isEnabled,
}: UseCompanyOrdersStateArgs): UseCompanyOrdersStateResult => {
  const [filters, setFilters] = useState<CompanyOrdersFiltersInput>(() =>
    getCompanyOrdersInitFilter(selectedCompanyId),
  );

  const pagination = useUnifiedOrdersPagination();
  const sorting = useCompanyOrderSorting(pagination.resetPagination);

  const placedByUsers = usePlacedByUsers({
    enabled: isEnabled,
    companyIds: filters.companyIds,
  });

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

    let resolvedCustomerId: number[] | undefined;
    const rawPlacedBy = normalizeString(value.PlacedBy);
    if (rawPlacedBy) {
      const match = placedByUsers.find((u) => formatPlacedByLabel(u) === rawPlacedBy);
      resolvedCustomerId = match ? [match.entityId] : undefined;
    }

    pagination.resetPagination();
    setFilters((prev) => ({
      ...prev,
      status: resolvedStatuses,
      dateRange: packDateRange(value.startValue, value.endValue),
      customerId: resolvedCustomerId,
    }));
  };

  const handleCompanyIdsChange = (companyIds: number[]) => {
    const isAll = companyIds.length === 0 || companyIds.includes(-1);
    pagination.resetPagination();
    setFilters((prev) => ({
      ...prev,
      companyIds: isAll ? undefined : companyIds.map(String),
      customerId: undefined,
    }));
  };

  return {
    ...pagination,
    ...sorting,
    filters,
    placedByUsers,
    handleSearchChange,
    handleFilterChange,
    handleCompanyIdsChange,
  };
};
