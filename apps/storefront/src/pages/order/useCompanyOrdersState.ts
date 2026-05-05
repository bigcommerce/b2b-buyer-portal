import { useEffect, useMemo, useState } from 'react';

import { CompanyOrdersFiltersInput, OrdersSortInput } from '@/shared/service/bc/graphql/orders';
import { OrderStatusItem } from '@/types';

import { getCompanyOrdersInitFilter, packDateRange } from './unifiedApiFiltersHelper';
import {
  useUnifiedOrdersPagination,
  UseUnifiedOrdersPaginationResult,
} from './useUnifiedOrdersPagination';

type SortableColumnKey =
  | 'orderId'
  | 'poNumber'
  | 'totalIncTax'
  | 'status'
  | 'placedBy'
  | 'createdAt';
type SortDir = 'asc' | 'desc';

interface AppliedFilters {
  startValue?: string;
  endValue?: string;
  orderStatus?: string | number;
  PlacedBy?: string;
  company?: string;
}

const COLUMN_KEY_TO_SORT_INPUT: Record<SortableColumnKey, Record<SortDir, OrdersSortInput>> = {
  orderId: { asc: OrdersSortInput.ID_A_TO_Z, desc: OrdersSortInput.ID_Z_TO_A },
  poNumber: { asc: OrdersSortInput.REFERENCE_A_TO_Z, desc: OrdersSortInput.REFERENCE_Z_TO_A },
  totalIncTax: {
    asc: OrdersSortInput.LOWEST_TOTAL_INC_TAX,
    desc: OrdersSortInput.HIGHEST_TOTAL_INC_TAX,
  },
  status: { asc: OrdersSortInput.STATUS_A_TO_Z, desc: OrdersSortInput.STATUS_Z_TO_A },
  placedBy: { asc: OrdersSortInput.PLACED_BY_A_TO_Z, desc: OrdersSortInput.PLACED_BY_Z_TO_A },
  createdAt: { asc: OrdersSortInput.CREATED_AT_OLDEST, desc: OrdersSortInput.CREATED_AT_NEWEST },
};

const SORTABLE_KEYS: ReadonlySet<SortableColumnKey> = new Set(
  Object.keys(COLUMN_KEY_TO_SORT_INPUT) as SortableColumnKey[],
);

const isSortableKey = (key: string): key is SortableColumnKey =>
  SORTABLE_KEYS.has(key as SortableColumnKey);

const normalizeString = (value: string | number | null | undefined): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const str = String(value);
  return str === '' ? undefined : str;
};

const DEFAULT_SORT: { key: SortableColumnKey; dir: SortDir } = { key: 'orderId', dir: 'desc' };

interface UseCompanyOrdersStateArgs {
  selectedCompanyId: number;
  orderStatuses: OrderStatusItem[];
}

export interface UseCompanyOrdersStateResult extends UseUnifiedOrdersPaginationResult {
  filters: CompanyOrdersFiltersInput;
  sortBy: OrdersSortInput;
  activeSort: { key: SortableColumnKey; dir: SortDir };
  handleSearchChange: (key: string, value: string) => void;
  handleFilterChange: (value: AppliedFilters) => void;
  handleCompanyIdsChange: (companyIds: number[]) => void;
  handleSetOrderBy: (key: string) => void;
}

export const useCompanyOrdersState = ({
  selectedCompanyId,
  orderStatuses,
}: UseCompanyOrdersStateArgs): UseCompanyOrdersStateResult => {
  const [filters, setFilters] = useState<CompanyOrdersFiltersInput>(() =>
    getCompanyOrdersInitFilter(selectedCompanyId),
  );
  const [activeSort, setActiveSort] = useState(DEFAULT_SORT);

  const pagination = useUnifiedOrdersPagination();

  useEffect(() => {
    setFilters(getCompanyOrdersInitFilter(selectedCompanyId));
  }, [selectedCompanyId]);

  const sortBy = useMemo(
    () => COLUMN_KEY_TO_SORT_INPUT[activeSort.key][activeSort.dir],
    [activeSort],
  );

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

  const handleSetOrderBy = (key: string) => {
    if (!isSortableKey(key)) return;
    pagination.resetPagination();
    setActiveSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' },
    );
  };

  return {
    ...pagination,
    filters,
    sortBy,
    activeSort,
    handleSearchChange,
    handleFilterChange,
    handleCompanyIdsChange,
    handleSetOrderBy,
  };
};
