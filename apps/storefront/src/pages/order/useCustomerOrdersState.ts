import { useEffect, useMemo, useState } from 'react';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { OrdersFiltersInput, OrdersSortInput } from '@/shared/service/bc/graphql/orders';
// Status list still comes from the legacy `orderStatuses` query — the unified
// schema doesn't expose one yet, so we depend on the legacy type here.
import { OrderStatusItem } from '@/types';

import { getCustomerOrdersInitFilter, packDateRange } from './unifiedApiFiltersHelper';
import {
  useUnifiedOrdersPagination,
  UseUnifiedOrdersPaginationResult,
} from './useUnifiedOrdersPagination';

type SortableColumnKey = 'orderId' | 'poNumber' | 'totalIncTax' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';

interface AppliedFilters {
  startValue?: string;
  endValue?: string;
  orderStatus?: string | number;
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

interface UseCustomerOrdersStateArgs {
  companyId: number;
  orderStatuses: OrderStatusItem[];
  isCompanyOrder: boolean;
}

export interface UseCustomerOrdersStateResult extends UseUnifiedOrdersPaginationResult {
  filters: OrdersFiltersInput;
  sortBy: OrdersSortInput;
  activeSort: { key: SortableColumnKey; dir: SortDir };
  handleSearchChange: (key: string, value: string) => void;
  handleFilterChange: (value: AppliedFilters) => void;
  handleCompanyIdsChange: (companyIds: number[]) => void;
  handleSetOrderBy: (key: string) => void;
}

export const useCustomerOrdersState = ({
  companyId,
  orderStatuses,
  isCompanyOrder,
}: UseCustomerOrdersStateArgs): UseCustomerOrdersStateResult => {
  const [filters, setFilters] = useState<OrdersFiltersInput>(() =>
    getCustomerOrdersInitFilter(companyId),
  );
  const [activeSort, setActiveSort] = useState(DEFAULT_SORT);

  const pagination = useUnifiedOrdersPagination();

  const isUnifiedOrdersNonCompanyOrderPath =
    useFeatureFlag('B2B-4613.buyer_portal_unified_sf_gql_orders') && !isCompanyOrder;

  useEffect(() => {
    if (isUnifiedOrdersNonCompanyOrderPath) setFilters(getCustomerOrdersInitFilter(companyId));
  }, [companyId, isUnifiedOrdersNonCompanyOrderPath]);

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
